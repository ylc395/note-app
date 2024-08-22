import { uniq, pick, first } from 'lodash-es';
import assert from 'assert';
import { singleton } from 'tsyringe';

import {
  type MaterialDTO,
  type MaterialVO,
  type Material,
  type ClientMaterialQuery,
  type MaterialPatchDTO,
  type MaterialBatchPatchDTO,
  isEntityMaterial,
} from '@domain/shared/model/material.js';
import { EntityTypes } from '@domain/shared/model/entity.js';
import { EventNames } from '@domain/server/model/content.js';
import { buildIndex } from '@utils/collection.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class MaterialService extends BaseService {
  @BaseService.transaction()
  public async create(newMaterial: MaterialDTO) {
    if (newMaterial.parentId) {
      await this.assertAvailableIds([newMaterial.parentId]);
    }

    if (newMaterial.fileId) {
      const file = await this.repo.files.findOneById(newMaterial.fileId);
      assert(file, `invalid file id: ${newMaterial.fileId}`);
    }

    const now = Date.now();
    const material = await this.repo.materials.create({
      ...newMaterial,
      id: EntityService.generateId(),
      title: newMaterial.title || '',
      icon: newMaterial.icon || null,
      parentId: newMaterial.parentId || null,
      updatedAt: now,
      createdAt: now,
    });

    if (material.title || (isEntityMaterial(material) && material.comment)) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        body: isEntityMaterial(material) ? material.comment : undefined,
        title: material.title,
        entityId: material.id,
        entityType: EntityTypes.Material,
        updatedAt: material.updatedAt,
      });
    }

    return this.toVO(material, true);
  }

  @BaseService.transaction()
  public async query(q: ClientMaterialQuery) {
    const materials = await this.repo.materials.findAll({
      ...q,
      parentId: q.parentId || null,
      isAvailableOnly: true,
    });

    return this.toVO(materials);
  }

  private async toVO(materials: Material, isNew?: boolean): Promise<Required<MaterialVO>>;
  private async toVO(materials: Material[]): Promise<MaterialVO[]>;
  private async toVO(materials: Material[] | Material, isNew?: boolean): Promise<MaterialVO[] | MaterialVO> {
    const _materials = Array.isArray(materials) ? materials : [materials];
    const ids = _materials.map(({ id }) => id);
    const children = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });
    const stars = isNew ? {} : buildIndex(await this.repo.stars.findAll({ entityIds: ids }), 'entityId');

    const materialVOs = _materials.map((material) => ({
      ...pick(material, ['id', 'title', 'icon', 'parentId', 'updatedAt', 'createdAt']),
      ...(isEntityMaterial(material) ? pick(material, ['mimeType', 'comment', 'sourceUrl']) : null),
      childrenCount: children[material.id]?.length || 0,
      isStar: Boolean(stars[material.id]),
    }));

    return Array.isArray(materials) ? materialVOs : first(materialVOs)!;
  }

  @BaseService.transaction()
  public async queryOne(id: Material['id']) {
    const material = await this.repo.materials.findOneById(id, { isAvailableOnly: true });

    assert(material);
    return await this.toVO(material);
  }

  @BaseService.transaction()
  public async batchUpdate(ids: Material['id'][], patch: MaterialBatchPatchDTO) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    await this.repo.materials.update(ids, patch);
  }

  @BaseService.transaction()
  public async updateOne(materialId: Material['id'], patch: MaterialPatchDTO) {
    const isEntityPatch = typeof patch.comment === 'string' || typeof patch.sourceUrl === 'string';
    await this.assertAvailableIds([materialId], { type: isEntityPatch ? 'entity' : 'directory' });

    const now = Date.now();
    const hasContentUpdated = typeof patch.comment === 'string' || typeof patch.title === 'string';

    await this.repo.materials.update(materialId, {
      ...patch,
      updatedAt: hasContentUpdated ? now : undefined,
    });

    if (hasContentUpdated) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        body: patch.comment,
        title: patch.title,
        entityId: materialId,
        entityType: EntityTypes.Material,
        updatedAt: now,
      });
    }
  }

  private async assertValidParent(parentId: Material['id'], childrenIds: Material['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descants = await this.repo.entities.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descants[id]?.includes(parentId), 'invalid parentId');
    }
  }

  @BaseService.transaction()
  public async getBlob(materialId: MaterialVO['id']) {
    const blob = await this.repo.materials.findBlobById(materialId, { isAvailableOnly: true });
    assert(blob);

    return blob;
  }

  public async assertAvailableIds(ids: MaterialVO['id'][], params?: { type?: 'entity' | 'directory' }) {
    ids = uniq(ids);
    const rows = await this.repo.materials.findAll({ id: ids, isAvailableOnly: true });
    let result = rows.length === ids.length;

    if (result && params) {
      result = rows.every((row) => {
        if (params.type) {
          return params.type === 'entity' ? isEntityMaterial(row) : !isEntityMaterial(row);
        }

        return true;
      });
    }

    assert(result, 'invalid material id');
  }
}
