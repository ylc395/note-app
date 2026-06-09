import { action, computed, observable, toJS } from 'mobx';
import { z } from 'zod';
import { clone, compact, debounce, isEqual, keyBy } from 'lodash-es';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type PageTextManager from './PageTextManager';
import type { NoteVO } from '#domain/shared/model/note';
import EventBus from '#domain/client/shared/infra/EventBus';

export interface Digest {
  text: string;
  hasLeading: boolean;
  hasTrailing: boolean;
  matchIndex: number;
  matchLength: number;
}

interface SearchResult {
  pageMatches?: Readonly<number[][]>;
  pageMatchesLength?: Readonly<number[][]>;
  current: number; // 从 1 开始
  total: number;
  shouldRender?: boolean; // 是否需要进行渲染。pdfjs 原生的搜索能力无需渲染
  isFinal?: boolean; // 本次搜索的最后一次更新。没有结果就是真没有了
}

/*
 * 记录用户的搜索条件，并保存搜索结果（含摘要）
 * 其中，搜索结果由外部提供，或是通过远程搜索来获得。该类本身没有从 PDF 中搜索文本的能力
 * 同时，该类负责从 pageTextManager 中根据搜索结果的位置信息等提取摘要
 */
export default class TextFinder {
  constructor(private readonly noteId: NoteVO['id'], private readonly textManager: PageTextManager) {}

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor isEnabled = false;

  @observable private accessor _result: { result: SearchResult; options: TextFinder['options'] } | undefined;

  @observable.ref public accessor digests: Array<{ page: number; digests: Digest[] }> | undefined;

  @observable public accessor options: z.infer<typeof TextFinder.schema> = {};

  public readonly eventBus = new EventBus<{ next: undefined; prev: undefined; jump: number }>('pdfTextFinder');

  @action
  public setCurrent(index: number) {
    assert(this._result && index < this._result.result.total);
    this._result.result.current = index + 1;
    this.eventBus.emit('jump', index);
  }

  @action.bound
  public next() {
    if (this._result) {
      this._result.result.current = (this._result.result.current % this._result.result.total) + 1;
    }

    this.eventBus.emit('next');
  }

  @action.bound
  public prev() {
    if (this._result) {
      this._result.result.current =
        ((this._result.result.current - 2 + this._result.result.total) % this._result.result.total) + 1;
    }
    this.eventBus.emit('prev');
  }

  @computed
  public get result() {
    return this._result?.result;
  }

  // 根据 current 计算对应的页码
  @computed
  public get currentPage() {
    if (!this.result?.pageMatches) {
      return null;
    }

    let count = 0;

    for (const [i, matches] of Object.entries(this.result.pageMatches)) {
      if (count + matches.length >= this.result.current) {
        return Number(i) + 1;
      }

      count += matches.length;
    }

    return null;
  }

  @action
  public init(v?: TextFinder['options']) {
    if (v) {
      this.options = v;
    }
  }

  @action
  public setKeyword(value: string) {
    if (value === this.options.query) {
      return;
    }

    this.clearResult();
    this.options.query = value;
  }

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;
    this.clearResult();
  }

  @action
  public toggleOption(key: 'caseSensitive' | 'entireWord') {
    this.clearResult();
    this.options[key] = !this.options[key];
  }

  @action
  public updateResult(result: SearchResult, pageTexts?: Record<number, string>) {
    // 无效更新
    if (isEqual(this.options, this._result?.options) && result.total === 0 && !result.isFinal) {
      return;
    }

    this._result = {
      result,
      options: clone(this.options),
    };

    if (result.pageMatchesLength && result.pageMatches && result.total > 0) {
      pageTexts = pageTexts || this.textManager.nativeTexts.result.data;
      assert(pageTexts);

      this.updateDigests(
        {
          pageMatches: result.pageMatches,
          pageMatchesLength: result.pageMatchesLength,
        },
        pageTexts,
      );
    }
  }

  public async searchByRemote(params: { prev?: boolean; currentPage: number }) {
    if (!this.options.query) {
      return;
    }

    // 什么搜索条件都没变，就不要再搜索了
    if (isEqual(this.options, this._result?.options)) {
      return;
    }

    const remoteSearchResult = await this.remote.note.searchNoteFileContent.query({
      id: this.noteId,
      keyword: this.options.query,
    });

    const pageTexts = remoteSearchResult.reduce<Record<number, string>>((dict, result) => {
      if (!result.location.page) {
        return dict;
      }

      dict[result.location.page] = result.text;
      return dict;
    }, {});

    const indexedResult = keyBy(remoteSearchResult, ({ location: { page } }) => page || '');

    const result = Array.from({ length: this.textManager.totalPages }).map((_, i) => ({
      offset: indexedResult[i + 1]?.offsets.map(({ start }) => start) ?? [],
      length: indexedResult[i + 1]?.offsets.map(({ start, end }) => end - start) ?? [],
    }));

    const pageMatches = result.map(({ offset }) => offset);
    const matchCountsPerPage = pageMatches.map((matches) => matches.length);

    // 计算前缀和，用于快速定位全局匹配序号
    const prefixSum: number[] = [];
    let accumulated = 0;
    for (const count of matchCountsPerPage) {
      prefixSum.push(accumulated);
      accumulated += count;
    }

    let current: number;
    const pageIndex = params.currentPage - 1; // 转为 0-based

    if (params.prev) {
      // 往前找：从当前页往前找第一个有匹配的页，取该页最后一个匹配
      current = accumulated; // 默认回绕到最后一个匹配
      for (let i = Math.min(pageIndex, matchCountsPerPage.length - 1); i >= 0; i--) {
        if (matchCountsPerPage[i]! > 0) {
          current = prefixSum[i]! + matchCountsPerPage[i]!;
          break;
        }
      }
    } else {
      // 往后找：从当前页往后找第一个有匹配的页，取该页第一个匹配
      current = 1; // 默认回绕到第一个匹配
      for (let i = Math.max(0, pageIndex); i < matchCountsPerPage.length; i++) {
        if (matchCountsPerPage[i]! > 0) {
          current = prefixSum[i]! + 1;
          break;
        }
      }
    }

    this.updateResult(
      {
        total: accumulated,
        current,
        pageMatches,
        shouldRender: true,
        pageMatchesLength: result.map(({ length }) => length),
        isFinal: true,
      },
      pageTexts,
    );
  }

  private readonly updateDigests = debounce(
    action(
      (
        {
          pageMatchesLength,
          pageMatches,
        }: { pageMatches: Readonly<number[][]>; pageMatchesLength: Readonly<number[][]> },
        pageTexts: Record<number, string>,
      ) => {
        const digests = pageMatches
          .map((matchOffsets: number[], pageIndex) => ({
            page: pageIndex + 1,
            digests: compact(
              matchOffsets.map((offset, index) =>
                TextFinder.extractDigest({
                  fullText: pageTexts[pageIndex + 1] || '',
                  matchIndex: offset,
                  maxLength: 100,
                  prefixMaxLength: 30,
                  matchLength: pageMatchesLength[pageIndex]![index]!,
                }),
              ),
            ),
          }))
          .filter(({ digests }) => digests.length > 0);

        // 无效更新
        if (digests.length === 0 && isEqual(this._result?.options, this.options)) {
          return;
        }

        this.digests = digests;
      },
    ),
    500,
  );

  @action
  public clearResult() {
    this.digests = undefined;
    this._result = undefined;
  }

  public destroy() {
    this.updateDigests.cancel();
  }

  public toJSON() {
    return toJS(this.options);
  }

  private static extractDigest(params: {
    lang?: string;
    fullText: string;
    matchIndex: number;
    maxLength: number;
    matchLength: number;
    prefixMaxLength?: number;
  }) {
    // 第一个参数（locale）似乎不影响 Intl.Segmenter 分词的正确性
    // 没有明确的结论，初步的讨论见 https://stackoverflow.com/questions/75747868/how-exactly-locale-param-affects-the-result-of-intl-segmenter-execution-in-jav
    // AI 认为这是因为各个 JS 引擎的内部有类似智能识别语言种类的优化
    const segmenter = new Intl.Segmenter(params.lang, { granularity: 'word' });
    const digest = {
      text: '',
      hasLeading: false,
      hasTrailing: false,
      matchIndex: -1,
      matchLength: params.matchLength,
    };
    const prefixMaxLength = params.prefixMaxLength ?? Math.floor(params.maxLength / 2);

    let i = 0;
    let isFirstSegmentInDigest = true;

    for (const segment of segmenter.segment(params.fullText)) {
      if (segment.index <= params.matchIndex && segment.index + segment.segment.length > params.matchIndex) {
        digest.matchIndex = digest.text.length + (params.matchIndex - segment.index);
      }

      if (digest.text.length + segment.segment.length > params.maxLength) {
        digest.hasTrailing = true;
        break;
      }

      if (params.matchIndex - segment.index <= prefixMaxLength) {
        if (digest.text || segment.isWordLike) {
          digest.text += segment.segment;
        }

        if (i > 0 && isFirstSegmentInDigest) {
          digest.hasLeading = true;
        }

        isFirstSegmentInDigest = false;
      }

      i++;
    }

    if (digest.text) {
      return digest;
    }

    return undefined;
  }

  public static readonly schema = z.object({
    caseSensitive: z.boolean().optional().catch(undefined),
    entireWord: z.boolean().optional().catch(undefined),
    query: z.string().optional().catch(undefined),
  });
}
