import { type Kysely, sql } from 'kysely';
import { compact, keyBy } from 'lodash-es';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SearchEngine } from '#domain/server/infra/searchEngine.js';
import { token as repositoriesToken } from '#domain/server/repository/index.js';
import {
  SearchFields,
  SearchRequest,
  type AnnotationMatchRecord,
  type FileMatchRecord,
  type SearchResult,
} from '#domain/shared/model/search.js';
import { type EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import container from '#utils/singletonContainer.js';

import type SqliteDb from '../Database.js';
import { tableName as recyclablesTableName } from '../schema/recyclable.js';
import { tableName as filesTableName } from '../schema/file.js';
import { tableName as linkTableName } from '../schema/link.js';
import {
  type SearchEngineDb,
  initialSqls,
  WRAPPER_START_TEXT,
  WRAPPER_END_TEXT,
  notesFTSTableName,
  fileTextsFTSTableName,
} from './tables.js';
import { annotationSchema } from '#domain/shared/infra/apiSchema/annotation.js';

export default class SqliteSearchEngine implements SearchEngine {
  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.createTables();
  }
  public ready: Promise<void>;

  private get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private readonly repo = container.resolve(repositoriesToken);

  private async createTables() {
    await this.sqliteDb.ready;

    // sqlite 内置的 tokenizer 无法为 CJK 字符或词汇建立索引（只能为一整片连续的 CJK 建立索引）。因此必须使用 simple tokenizer
    const extensionPath = join(dirname(fileURLToPath(import.meta.url)), 'simple-tokenizer');
    this.sqliteDb.rawDb.loadExtension(join(extensionPath, 'libsimple'));

    // 使用 jieba 之后，可为汉语词汇建立索引，从而增加查询速度和准确度
    this.sqliteDb.rawDb.prepare('select jieba_dict(?)').run(join(extensionPath, 'dict'));

    this.sqliteDb.transaction(async () => {
      for (const { tableName, sql } of initialSqls) {
        if (this.sqliteDb.hasTable(tableName)) {
          continue;
        }

        for (const s of sql) {
          await s.execute(this.db);
        }
      }
    });
  }

  private async searchFileText({ keyword, entityIds }: { keyword: string; entityIds?: EntityId[] }) {
    return this.db
      .selectFrom(fileTextsFTSTableName)
      .innerJoin(filesTableName, `${fileTextsFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(notesFTSTableName, `${notesFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(linkTableName, `${linkTableName}.target`, `${filesTableName}.id`)
      .leftJoin(recyclablesTableName, (join) =>
        join.on((eb) =>
          eb.or([
            eb(`${linkTableName}.sourceId`, '=', `${recyclablesTableName}.entityId`),
            eb(`${notesFTSTableName}.id`, '=', `${recyclablesTableName}.entityId`),
          ]),
        ),
      )
      .where((eb) => {
        return eb.and(
          compact([
            eb.or([eb(`${notesFTSTableName}.fileId`, 'is not', null), eb(`${linkTableName}.target`, 'is not', null)]),
            eb(fileTextsFTSTableName, 'match', keyword),
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            entityIds &&
              entityIds.length > 0 &&
              eb.or([eb(`${notesFTSTableName}.id`, 'in', entityIds), eb(`${linkTableName}.sourceId`, 'in', entityIds)]),
          ]),
        );
      })
      .select(({ fn, val }) => [
        `${notesFTSTableName}.id as noteId`,
        `${linkTableName}.sourceId as entityId`,
        `${fileTextsFTSTableName}.rank`,
        `${fileTextsFTSTableName}.fileId`,
        `${fileTextsFTSTableName}.location`,
        fn<string>('simple_snippet', [
          sql.raw(fileTextsFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('contentResult'),
        fn<string | null>('simple_highlight_pos', [sql.raw(fileTextsFTSTableName), val(1)]).as('contentOffsets'),
        sql<string | null>`${sql.table(fileTextsFTSTableName)}.text`.as('contentText'),
      ])
      .execute();
  }

  public async search(q: Required<SearchRequest>): Promise<SearchResult[]> {
    const descantIds =
      q.rootId.length > 0
        ? [...Object.values(await this.repo.entities.findDescendantIds(q.rootId)).flat(), ...q.rootId]
        : undefined;

    const rows = await this.db
      .selectFrom(notesFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${notesFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${notesFTSTableName}.id as entityId`,
        'type',
        'parentId',
        'rank',
        'details',
        fn<string | null>('simple_snippet', [
          sql.raw(notesFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('titleResult'),
        fn<string | null>('simple_snippet', [
          sql.raw(notesFTSTableName),
          val(2),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('contentResult'),
        fn<string | null>('simple_highlight_pos', [sql.raw(notesFTSTableName), val(1)]).as('titleOffsets'),
        fn<string | null>('simple_highlight_pos', [sql.raw(notesFTSTableName), val(2)]).as('contentOffsets'),
        sql<string | null>`${sql.table(notesFTSTableName)}.title`.as('titleText'),
        sql<string | null>`${sql.table(notesFTSTableName)}.body_plain_text`.as('contentText'),
      ])
      .where((eb) => {
        const titleIncluded = q.fields.includes(SearchFields.Title);
        const bodyIncluded = q.fields.includes(SearchFields.Body);

        if (titleIncluded && bodyIncluded) {
          /* simple_query 对传入的关键字做了以下处理：
            1. 如果查数字，我们要把搜索词当作前缀来用，比如用户搜索 123， query 就需要换成 123*，这样如果索引里面有 12345 也能被搜索出来
            2. 对于英文，除了要当作前缀，还需要把搜索词转成小写，比如用户搜索 Hello，query 就需要换成 hello*, 这样如果索引里面有 HelloWorld 也能被命中
            3. 对于中文和其他字符，拆出词汇（jieba 分词）或单字
            4. 最后对于拼音（其实我们没办法区分英文和拼音，统一当作拼音处理就行），需要把拼音按照规则拆分，因为我们的拼音索引是单字建立的。这样如果用户搜索 “zhangliangy”，拼音就可以被拆成 ‘zhang AND liang AND y*’，从而命中"张靓颖"。具体规则微信的文章中也有详述。
          
            来源：https://www.wangfenjin.com/posts/simple-tokenizer/#query-%E6%8B%86%E5%88%86 以及 https://www.wangfenjin.com/posts/simple-jieba-tokenizer/#%E5%AE%9E%E7%8E%B0
          */
          return eb(notesFTSTableName, 'match', eb.fn<string>('jieba_query', [eb.val(q.keyword)]));
        }

        if (titleIncluded) {
          // 这种单列过滤的 hack 写法来自 https://github.com/wangfenjin/simple/issues/139#issuecomment-1833147609
          return eb(notesFTSTableName, 'match', sql<string>`'title : ' || jieba_query(${sql.lit(q.keyword)})`);
        }

        return eb(notesFTSTableName, 'match', sql<string>`'body_plain_text : ' || jieba_query(${sql.lit(q.keyword)})`);
      })
      .where((eb) => {
        return eb.and(
          compact([
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            eb('type', 'in', [
              ...q.entityTypes,
              ...(q.fields.includes(SearchFields.Annotation) ? [EntityTypes.Annotation] : []),
            ]),
            descantIds && eb(`${notesFTSTableName}.id`, 'in', descantIds),
          ]),
        );
      })
      .orderBy((eb) => eb.fn('bm25', [notesFTSTableName, sql.val(1), sql.val(10), sql.val(5)]))
      .execute();

    const typeGroup = Object.groupBy(rows, ({ type }) => type);

    const notes = typeGroup[EntityTypes.Note] || [];
    const memos = typeGroup[EntityTypes.Memo] || [];
    const annotations = typeGroup[EntityTypes.Annotation] || [];

    const searchResult: SearchResult[] = [...notes, ...memos].map((row) => ({
      entityId: row.entityId,
      rank: row.rank,
      matches: {
        [SearchFields.Title]: row.titleResult
          ? SqliteSearchEngine.parseSearchResult(row.titleResult, row.titleOffsets, row.titleText)
          : undefined,
        [SearchFields.Body]: row.contentResult
          ? SqliteSearchEngine.parseSearchResult(row.contentResult, row.contentOffsets, row.contentText)
          : undefined,
      },
    }));

    const resultMap = keyBy(searchResult, ({ entityId }) => entityId);

    for (const { entityId, contentResult, rank, parentId, details, contentOffsets, contentText } of annotations) {
      const result = resultMap[entityId];
      const selector = annotationSchema.shape.selector.safeParse(details?.selector).data;

      if (!contentResult || !parentId || !selector) {
        continue;
      }

      const parsed = SqliteSearchEngine.parseSearchResult(contentResult, contentOffsets, contentText);

      if (!parsed) {
        continue;
      }

      const matchRecord: AnnotationMatchRecord = {
        ...parsed,
        id: entityId,
        selector,
      };

      if (result) {
        (result.matches[SearchFields.Annotation] ||= []).push(matchRecord);
      } else {
        const newResult = {
          entityId: parentId!,
          type: EntityTypes.Note,
          rank,
          matches: { [SearchFields.Annotation]: [matchRecord] },
        };
        resultMap[parentId] = newResult;
        searchResult.push(newResult);
      }
    }

    if (q.fields.includes(SearchFields.File)) {
      const fileTextResult = await this.searchFileText({ keyword: q.keyword, entityIds: descantIds });

      for (const {
        noteId,
        entityId,
        contentResult,
        rank,
        location: { page, confidence },
        contentOffsets,
        contentText,
      } of fileTextResult) {
        const result = (noteId && resultMap[noteId]) || (entityId && resultMap[entityId]);
        const id = noteId || entityId;
        const parsed = SqliteSearchEngine.parseSearchResult(contentResult, contentOffsets, contentText);

        if (!parsed) {
          continue;
        }

        const fileMatchRecord: FileMatchRecord = {
          ...parsed,
          location: { page, confidence },
        };

        if (result) {
          (result.matches[SearchFields.File] ??= []).push(fileMatchRecord);
        } else if (id) {
          const newResult = {
            entityId: id,
            rank,
            matches: { [SearchFields.File]: [fileMatchRecord] },
          };
          resultMap[id] = newResult;
          searchResult.push(newResult);
        }
      }
    }

    return searchResult;
  }

  private static parseSearchResult(str: string, offsetsStr?: string | null, columnText?: string | null) {
    const highlights: { start: number; end: number }[] = [];

    let i = 0;
    let index = -1;

    while ((index = str.indexOf(WRAPPER_START_TEXT, index + 1)) > -1) {
      const endIndex = str.indexOf(WRAPPER_END_TEXT, index + 1);

      highlights.push({
        start: index - (WRAPPER_START_TEXT.length + WRAPPER_END_TEXT.length) * i,
        end: endIndex - (WRAPPER_START_TEXT.length * (i + 1) + WRAPPER_END_TEXT.length * i),
      });

      i += 1;
    }

    if (i === 0) {
      return undefined;
    }

    // 解析 simple_highlight_pos 返回的偏移信息，格式为 "start,end;start,end;"
    // 其中 start/end 是匹配在原始列文本中的字节偏移，需要转换为字符偏移
    const offsets: { start: number; end: number }[] = [];

    if (offsetsStr) {
      const byteToCharMap = columnText ? SqliteSearchEngine.buildByteToCharMap(columnText) : undefined;

      for (const pair of offsetsStr.split(';')) {
        const trimmed = pair.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(',');
        if (parts.length >= 2) {
          const byteStart = Number(parts[0]);
          const byteEnd = Number(parts[1]);

          if (byteToCharMap) {
            const charStart = byteToCharMap[byteStart] ?? byteStart;
            const charEnd = byteToCharMap[byteEnd] ?? byteEnd;
            offsets.push({ start: charStart, end: charEnd });
          } else {
            offsets.push({ start: byteStart, end: byteEnd });
          }
        }
      }
    }

    return {
      text: str.replaceAll(WRAPPER_START_TEXT, '').replaceAll(WRAPPER_END_TEXT, ''),
      highlights,
      offsets,
    };
  }

  /**
   * 构建字节偏移到字符偏移的映射表。
   * 对于纯 ASCII 文本，字节偏移 === 字符偏移；
   * 对于含多字节字符（如中文）的文本，需要通过 UTF-8 编码来建立映射。
   */
  private static buildByteToCharMap(text: string): Record<number, number> {
    const map: Record<number, number> = {};
    let byteOffset = 0;

    for (let charIndex = 0; charIndex < text.length; charIndex++) {
      map[byteOffset] = charIndex;
      byteOffset += Buffer.byteLength(text[charIndex]!, 'utf-8');
    }

    // 末尾位置也需要映射
    map[byteOffset] = text.length;

    return map;
  }
}
