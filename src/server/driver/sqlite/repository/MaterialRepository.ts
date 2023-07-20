import pick from 'lodash/pick';
import { readFile } from 'fs-extra';
import type { Selectable } from 'kysely';

import type { MaterialRepository, Directory, MaterialQuery } from 'service/repository/MaterialRepository';
import type { DirectoryVO, EntityMaterialVO, MaterialDTO, MaterialVO } from 'interface/material';

import schema, { type Row } from '../schema/material';
import fileSchema, { type Row as FileRow } from '../schema/file';
import BaseRepository from './BaseRepository';
import FileRepository from './FileRepository';
import MaterialAnnotationRepository from './MaterialAnnotationRepository';

const { tableName } = schema;

export default class SqliteMaterialRepository extends BaseRepository implements MaterialRepository {
  private readonly files = new FileRepository(this.db);
  private readonly annotations = new MaterialAnnotationRepository(this.db);
  async createDirectory(directory: Directory) {
    const createdRow = await this.createOne(tableName, { ...directory, id: this.generateId() });
    return SqliteMaterialRepository.rowToDirectory(createdRow);
  }

  async createEntity(material: MaterialDTO) {
    let file: FileRow | null | undefined;

    if (material.fileId) {
      file = await this.files.findOneById(material.fileId);
    } else if (material.file?.path) {
      const data = await readFile(material.file.path);
      file = await this.files.findOrCreate({ data, mimeType: material.file.mimeType });
    } else if (material.file?.data) {
      file = await this.files.findOrCreate({
        data: typeof material.file.data === 'string' ? Buffer.from(material.file.data) : material.file.data,
        mimeType: material.file.mimeType,
      });
    }

    if (!file) {
      throw new Error('invalid material');
    }

    const createdMaterial = await this.createOne(tableName, {
      ...pick(material, ['name', 'icon', 'parentId']),
      id: this.generateId(),
      fileId: file.id,
    });

    return SqliteMaterialRepository.rowToMaterial(createdMaterial, file.mimeType);
  }

  private static rowToDirectory(row: Selectable<Row>, childrenCount = 0): DirectoryVO {
    return {
      ...pick(row, ['id', 'name', 'icon', 'parentId']),
      childrenCount,
    };
  }

  private static rowToMaterial(row: Selectable<Row>, mimeType: string): EntityMaterialVO {
    return {
      ...pick(row, ['name', 'icon', 'sourceUrl', 'createdAt', 'updatedAt']),
      mimeType,
      id: row.id,
      parentId: row.parentId,
    };
  }

  private async getChildrenCounts(ids: Row['id'][]) {
    const childrenCount = await this.db
      .selectFrom(tableName)
      .where('parentId', 'in', ids)
      .groupBy('parentId')
      .select([this.db.fn.countAll().as('childrenCount'), 'parentId'])
      .execute();

    return childrenCount.reduce((result, { parentId, childrenCount }) => {
      if (parentId) {
        result[parentId] = childrenCount as number;
      }
      return result;
    }, {} as Record<string, number>);
  }

  async findAll(query: MaterialQuery) {
    let qb = query.parentId
      ? this.db.selectFrom(tableName).where('parentId', '=', query.parentId)
      : this.db.selectFrom(tableName).where('parentId', 'is', null);

    if (query.ids) {
      qb = qb.where(`${tableName}.id`, 'in', query.ids);
    }

    const rows = await qb
      .leftJoin(fileSchema.tableName, `${tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll(tableName)
      .select([`${fileSchema.tableName}.mimeType`])
      .execute();

    const directories: DirectoryVO[] = [];
    const materials: EntityMaterialVO[] = [];

    for (const row of rows) {
      if (!SqliteMaterialRepository.isFileRow(row)) {
        directories.push(SqliteMaterialRepository.rowToDirectory(row));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        materials.push(SqliteMaterialRepository.rowToMaterial(row, row.mimeType!));
      }
    }

    const childrenCounts = await this.getChildrenCounts(directories.map(({ id }) => id));

    for (const directory of directories) {
      directory.childrenCount = childrenCounts[directory.id] || 0;
    }

    return [...directories, ...materials];
  }

  async findOneById(id: MaterialVO['id']) {
    const row = await this.db
      .selectFrom(tableName)
      .leftJoin(fileSchema.tableName, `${tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll(tableName)
      .select(`${fileSchema.tableName}.mimeType`)
      .where(`${tableName}.id`, '=', id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    if (SqliteMaterialRepository.isFileRow(row)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return SqliteMaterialRepository.rowToMaterial(row, row.mimeType!);
    }

    const childrenCounts = await this.getChildrenCounts([id]);
    return SqliteMaterialRepository.rowToDirectory(row, childrenCounts[id]);
  }

  async findBlobById(id: MaterialVO['id']) {
    const row = await this.db
      .selectFrom(tableName)
      .innerJoin(fileSchema.tableName, `${tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll()
      .where(`${tableName}.id`, '=', id)
      .executeTakeFirst();

    if (row) {
      return FileRepository.getBlob(row);
    }

    return null;
  }

  readonly createAnnotation = this.annotations.create.bind(this.annotations);
  readonly findAllAnnotations = this.annotations.findAll.bind(this.annotations);
  readonly removeAnnotation = this.annotations.remove.bind(this.annotations);
  readonly updateAnnotation = this.annotations.update.bind(this.annotations);
  readonly findAnnotationById = this.annotations.findOneById.bind(this.annotations);

  private static isFileRow(row: Selectable<Row>) {
    return Boolean(row.fileId);
  }

  async updateText<T>(materialId: MaterialVO['id'], payload: T) {
    const row = await this.db.selectFrom(tableName).selectAll().where('id', '=', materialId).executeTakeFirst();

    if (!row?.fileId) {
      return null;
    }

    return (await this.files.updateText(row.fileId, JSON.stringify(payload))) ? payload : null;
  }
}
