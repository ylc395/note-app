import { uniq, pick, mapValues } from 'lodash-es';
import assert from 'assert';
import { singleton } from 'tsyringe';

import {
  type NewMaterialDTO,
  type MaterialVO,
  type Material,
  type ClientMaterialQuery,
  type MaterialPatchDTO,
  MaterialTypes,
  isEntityMaterial,
  normalizeTitle,
} from '@domain/model/material.js';
import { EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import HierarchyBehavior from './behaviors/HierarchyBehavior.js';
import { buildIndex } from '@utils/collection.js';

@singleton()
export default class MaterialService extends BaseService {
  private readonly hierarchyBehavior = new HierarchyBehavior(this.repo.materials);

  public async create(newMaterial: NewMaterialDTO) {
    if (newMaterial.parentId) {
      await this.assertAvailableIds([newMaterial.parentId]);
    }

    if (newMaterial.fileId) {
      assert(await this.repo.files.findOneById(newMaterial.fileId));
    }

    const material = await this.repo.materials.create(newMaterial);
    return await this.toVO(material);
  }

  public async query(q: ClientMaterialQuery & { id?: Material['id'][] }): Promise<MaterialVO[]> {
    const materials = await this.repo.materials.findAll({ ...q, ...(q.fileHash ? null : { isAvailable: true }) });
    return await this.toVO(materials);
  }

  private async toVO(materials: Material): Promise<Required<MaterialVO>>;
  private async toVO(materials: Material[]): Promise<MaterialVO[]>;
  private async toVO(materials: Material[] | Material): Promise<MaterialVO[] | MaterialVO> {
    const _materials = Array.isArray(materials) ? materials : [materials];
    const ids = _materials.map(({ id }) => id);
    const entityIds = _materials.filter(isEntityMaterial).map(({ id }) => id);
    const children = await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });
    const stars = buildIndex(await this.repo.stars.findAllByEntityId(entityIds));
    const paths = Array.isArray(materials) ? {} : await this.getPaths(ids);

    const materialVOs = _materials.map((material) => ({
      ...pick(material, ['id', 'title', 'icon', 'parentId', 'updatedAt']),
      childrenCount: children[material.id]?.length || 0,
      isStar: Boolean(stars[material.id]),
      ...(isEntityMaterial(material) ? pick(material, ['mimeType', 'comment', 'sourceUrl']) : null),
      ...(Array.isArray(materials) ? null : { path: paths[materials.id] }),
    }));

    return Array.isArray(materials) ? (materialVOs as MaterialVO[]) : (materialVOs[0] as MaterialVO);
  }

  public async queryOne(id: Material['id']) {
    const material = await this.repo.materials.findOneById(id, true);

    assert(material);
    return await this.toVO(material);
  }

  public async batchUpdate(ids: Material['id'][], patch: MaterialPatchDTO) {
    return this.transaction(async () => {
      await this.assertAvailableIds(ids);

      if (patch.parentId) {
        await this.assertValidParent(patch.parentId, ids);
      }

      const result = await this.repo.materials.update(ids, {
        ...patch,
        updatedAt: Date.now(),
      });

      assert(result);
      return this.query({ id: ids });
    });
  }

  public async updateOne(materialId: Material['id'], patch: MaterialPatchDTO) {
    return this.transaction(async () => {
      const isEntityPatch = 'comment' in patch || 'sourceUrl' in patch;
      await this.assertAvailableIds([materialId], isEntityPatch ? { type: MaterialTypes.Entity } : undefined);

      const now = Date.now();
      const result = await this.repo.materials.update(materialId, { ...patch, updatedAt: now });
      assert(result);

      if (typeof patch.comment === 'string') {
        this.eventBus.emit('contentUpdated', {
          content: patch.comment,
          entityType: EntityTypes.Material,
          entityId: materialId,
          updatedAt: now,
        });
      }

      return this.queryOne(materialId);
    });
  }

  private async assertValidParent(parentId: Material['id'], childrenIds: Material['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descants = await this.repo.entities.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descants[id]?.includes(parentId), 'invalid parentId');
    }
  }

  public async getBlob(materialId: MaterialVO['id']) {
    await this.assertAvailableIds([materialId], { type: MaterialTypes.Entity });
    const blob = await this.repo.materials.findBlobById(materialId);
    assert(blob);

    return blob;
  }

  public readonly assertAvailableIds = async (
    ids: MaterialVO['id'][],
    params?: { type?: MaterialTypes; mimeType?: string },
  ) => {
    const uniqueIds = uniq(ids);
    const rows = await this.repo.materials.findAll({ id: uniqueIds, isAvailable: true });
    let result = rows.length === uniqueIds.length;

    if (params) {
      result = rows.every((row) => {
        if (params.mimeType) {
          return isEntityMaterial(row) && row.mimeType === params.mimeType;
        }

        if (params.type) {
          return params.type === MaterialTypes.Entity ? isEntityMaterial(row) : !isEntityMaterial(row);
        }
      });
    }

    assert(result, 'invalid material id');
  };

  public readonly getNormalizedTitles = async (ids: Material['id'][]) => {
    const entities = buildIndex(await this.repo.materials.findAll({ id: ids }));
    return mapValues(entities, normalizeTitle);
  };

  public readonly getPaths = async (ids: Material['id'][]) => {
    return this.hierarchyBehavior.getPaths(ids, normalizeTitle);
  };

  public async getTreeFragment(materialId: Material['id']) {
    await this.assertAvailableIds([materialId]);
    const nodes = await this.hierarchyBehavior.getTreeFragment(materialId);

    return await this.toVO(nodes as Material[]);
  }
}
