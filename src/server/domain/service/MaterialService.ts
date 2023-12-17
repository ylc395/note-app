import { uniq, omit, map } from 'lodash-es';
import { Injectable, Inject } from '@nestjs/common';
import assert from 'assert';

import {
  type NewAnnotationDTO,
  type NewMaterialDTO,
  type MaterialVO,
  type AnnotationVO,
  type AnnotationPatchDTO,
  type Material,
  type ClientMaterialQuery,
  type MaterialsPatchDTO,
  type MaterialEntity,
  type MaterialPatchDTO,
  AnnotationTypes,
  MaterialTypes,
  isEntityMaterial,
  isNewMaterialEntity,
  isDirectory,
} from '@domain/model/material.js';
import { EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import StarService from './StarService.js';
import EntityService from './EntityService.js';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject() private readonly starService!: StarService;
  @Inject() private readonly entityService!: EntityService;

  async create(newMaterial: NewMaterialDTO) {
    if (newMaterial.parentId) {
      await this.assertAvailableIds([newMaterial.parentId], { type: MaterialTypes.Directory });
    }

    if (isNewMaterialEntity(newMaterial)) {
      assert(await this.repo.files.findOneById(newMaterial.fileId));

      const material = await this.repo.materials.createEntity(newMaterial);
      return { ...omit(material, ['userUpdatedAt']), updatedAt: material.userUpdatedAt, isStar: false };
    } else {
      const directory = await this.repo.materials.createDirectory(newMaterial);
      return { ...omit(directory, ['userUpdatedAt']), updatedAt: directory.userUpdatedAt, childrenCount: 0 };
    }
  }

  async query(q: ClientMaterialQuery): Promise<MaterialVO[]> {
    const materials = await this.repo.materials.findAll({ ...q, isAvailable: true });
    return await this.toVO(materials);
  }

  private async toVO(materials: Material[]) {
    const children = await this.repo.materials.findChildrenIds(map(materials.filter(isDirectory), 'id'), true);
    const stars = await this.starService.getStarMap(map(materials.filter(isEntityMaterial), 'id'));
    const materialVOs = materials.map((material) => ({
      ...omit(material, ['userUpdatedAt']),
      updatedAt: material.userUpdatedAt,
      ...(isDirectory(material)
        ? { childrenCount: children[material.id]?.length || 0 }
        : { isStar: Boolean(stars[material]) }),
    }));

    return materialVOs as MaterialVO[];
  }

  async queryOne(id: Material['id']) {
    const material = await this.repo.materials.findOneById(id, true);

    assert(material);

    const result = {
      ...omit(material, ['userUpdatedAt']),
      updatedAt: material.userUpdatedAt,
    };

    if (isEntityMaterial(material)) {
      const stars = await this.starService.getStarMap([material.id]);
      const path = (await this.entityService.getPaths([{ entityId: material.id, entityType: EntityTypes.Material }]))[
        material.id
      ];

      assert(path);

      return {
        ...(result as MaterialEntity),
        isStar: Boolean(stars[material.id]),
        path,
      };
    } else {
      const children = await this.repo.materials.findChildrenIds([material.id]);

      return {
        ...result,
        childrenCount: children[material.id]?.length || 0,
      };
    }
  }

  async batchUpdate(ids: Material['id'][], patch: MaterialsPatchDTO['material']) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    await this.repo.materials.update(ids, {
      ...patch,
      userUpdatedAt: Date.now(),
    });
  }

  async updateOne(materialId: Material['id'], patch: MaterialPatchDTO) {
    const isEntityPatch = 'comment' in patch || 'sourceUrl' in patch;
    await this.assertAvailableIds([materialId], isEntityPatch ? { type: MaterialTypes.Entity } : undefined);

    const now = Date.now();
    await this.repo.materials.update(materialId, { ...patch, userUpdatedAt: now });

    if (typeof patch.comment === 'string') {
      this.eventBus.emit('contentUpdated', {
        content: patch.comment,
        entityType: EntityTypes.Material,
        entityId: materialId,
        updatedAt: now,
      });
    }
  }

  private async assertValidParent(parentId: Material['id'], childrenIds: Material['id'][]) {
    await this.assertAvailableIds([parentId], { type: MaterialTypes.Directory });
    const descants = await this.repo.materials.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descants[id]?.includes(parentId));
    }
  }

  async getBlob(materialId: MaterialVO['id']) {
    await this.assertAvailableIds([materialId], { type: MaterialTypes.Entity });
    const blob = await this.repo.materials.findBlobById(materialId);
    assert(blob);
    return blob;
  }

  private async assertAvailableIds(ids: MaterialVO['id'][], params?: { type?: MaterialTypes; mimeType?: string }) {
    const uniqueIds = uniq(ids);
    const rows = await this.repo.materials.findAll({ id: uniqueIds, isAvailable: true });
    const result =
      rows.length === uniqueIds.length &&
      (params
        ? rows.every((row) => {
            if (params.mimeType) {
              return isEntityMaterial(row) && row.mimeType === params.mimeType;
            }

            if (params.type) {
              const checker = params.type === MaterialTypes.Entity ? isEntityMaterial : isDirectory;
              return checker(row);
            }
          })
        : true);

    assert(result);
  }

  async getTreeFragment(materialId: Material['id'], type?: MaterialTypes) {
    await this.assertAvailableIds([materialId]);

    const ancestorIds = (await this.repo.materials.findAncestorIds([materialId]))[materialId] || [];
    const childrenIds = Object.values(await this.repo.materials.findChildrenIds(ancestorIds)).flat();

    const roots = await this.repo.materials.findAll({ parentId: null, type, isAvailable: true });
    const children = await this.repo.materials.findAll({ id: childrenIds, type });

    return await this.toVO([...roots, ...children]);
  }

  async createAnnotation(materialId: MaterialVO['id'], annotation: NewAnnotationDTO) {
    if (annotation.type === AnnotationTypes.PdfRange || annotation.type === AnnotationTypes.PdfArea) {
      await this.assertAvailableIds([materialId], { mimeType: 'application/pdf' });
    }

    if (annotation.type === AnnotationTypes.HtmlRange) {
      await this.assertAvailableIds([materialId], { mimeType: 'text/html' });
    }

    return await this.repo.materialAnnotations.create(materialId, annotation);
  }

  async queryAnnotations(materialId: MaterialVO['id']) {
    await this.assertAvailableIds([materialId], { type: MaterialTypes.Entity });
    return await this.repo.materialAnnotations.findAll(materialId);
  }

  async removeAnnotation(annotationId: AnnotationVO['id']) {
    await this.assertValidAnnotation(annotationId);
    const result = await this.repo.materialAnnotations.remove(annotationId);

    if (!result) {
      throw new Error('invalid annotation');
    }

    await this.repo.materials.update(result.materialId, { userUpdatedAt: Date.now() });
  }

  async updateAnnotation(annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    await this.assertValidAnnotation(annotationId);
    const updated = await this.repo.materialAnnotations.update(annotationId, patch);

    if (!updated) {
      throw new Error('invalid id');
    }
    await this.repo.materials.update(updated.materialId, { userUpdatedAt: updated.updatedAt });

    if (typeof patch.comment === 'string') {
      this.eventBus.emit('contentUpdated', {
        content: patch.comment,
        entityType: EntityTypes.MaterialAnnotation,
        entityId: annotationId,
        updatedAt: updated.updatedAt,
      });
    }

    return updated;
  }

  private async assertValidAnnotation(annotationId: AnnotationVO['id']) {
    const annotation = await this.repo.materialAnnotations.findOneById(annotationId);
    assert(annotation);
    await this.assertAvailableIds([annotation.materialId], { type: MaterialTypes.Entity });
  }
}
