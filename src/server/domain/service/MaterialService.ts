import uniq from 'lodash/uniq';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import map from 'lodash/map';
import { Injectable, Inject, forwardRef } from '@nestjs/common';

import {
  type NewAnnotationDTO,
  type NewMaterialDTO,
  type MaterialVO,
  type AnnotationVO,
  type AnnotationPatchDTO,
  type Material,
  type MaterialQuery,
  type MaterialPatch,
  AnnotationTypes,
  MaterialTypes,
  isEntityMaterial,
  isNewMaterialEntity,
  normalizeTitle,
  isDirectory,
} from 'model/material';
import { EntityTypes } from 'model/entity';
import { buildIndex, getLocators } from 'utils/collection';

import BaseService from './BaseService';
import StarService from './StarService';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject(forwardRef(() => StarService)) private readonly starService!: StarService;

  async create(newMaterial: NewMaterialDTO) {
    if (newMaterial.parentId) {
      await this.assertAvailableIds([newMaterial.parentId], MaterialTypes.Directory);
    }

    if (isNewMaterialEntity(newMaterial)) {
      if (!(await this.repo.files.findOneById(newMaterial.fileId))) {
        throw new Error('invalid fileId');
      }

      const material = await this.repo.materials.createEntity(newMaterial);
      return { ...material, name: normalizeTitle(material), isStar: false };
    } else {
      const directory = await this.repo.materials.createDirectory(newMaterial);
      return { ...directory, name: normalizeTitle(directory), isStar: false, childrenCount: 0 };
    }
  }

  private async toVOs(materials: Material[]) {
    const parentIds = map(materials.filter(isDirectory), 'id');
    const children = await this.repo.materials.findChildrenIds(parentIds, { isAvailable: true });
    const stars = await this.starService.getStarMap(getLocators(materials, EntityTypes.Note));

    return materials.map((material) => ({
      ...omit(material, ['userUpdatedAt']),
      isStar: Boolean(stars[material.id]),
      updatedAt: material.userUpdatedAt,
      name: normalizeTitle(material),
      ...(isEntityMaterial(material) ? null : { childrenCount: children[material.id]?.length || 0 }),
    })) as MaterialVO[];
  }

  async queryVO(q: MaterialQuery): Promise<MaterialVO[]>;
  async queryVO(q: MaterialVO['id']): Promise<MaterialVO>;
  async queryVO(q: MaterialQuery | MaterialVO['id']): Promise<MaterialVO[] | MaterialVO> {
    const materials = await this.repo.materials.findAll({
      ...(typeof q === 'string' ? { id: [q] } : q),
      isAvailable: true,
    });
    const materialVOs = await this.toVOs(materials);

    const result = typeof q === 'string' ? materialVOs[0] : materialVOs;

    if (!result) {
      throw new Error('no result');
    }

    return result;
  }

  async batchUpdate(ids: Material['id'][], patch: MaterialPatch) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    const result = await this.repo.materials.update(ids, {
      ...patch,
      ...(typeof patch.name === 'undefined' ? null : { userUpdatedAt: Date.now() }),
    });

    return this.toVOs(result);
  }

  private async assertValidParent(parentId: Material['id'], childrenIds: Material['id'][]) {
    await this.assertAvailableIds([parentId], MaterialTypes.Directory);

    const descants = await this.repo.materials.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      if (parentId === id || descants[id]?.includes(parentId)) {
        throw new Error('invalid new parent id');
      }
    }
  }

  async getTitles(ids: Material['id'][]) {
    const notes = await this.repo.materials.findAll({ id: ids });
    return mapValues(buildIndex(notes), normalizeTitle);
  }

  async getBlob(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    const blob = await this.repo.materials.findBlobById(materialId);

    if (blob === null) {
      throw new Error('no file');
    }

    return blob;
  }

  async createAnnotation(materialId: MaterialVO['id'], annotation: NewAnnotationDTO) {
    if (annotation.type === AnnotationTypes.PdfRange || annotation.type === AnnotationTypes.PdfArea) {
      await this.assertEntityMaterial(materialId, 'application/pdf');
    }

    if (annotation.type === AnnotationTypes.HtmlRange) {
      await this.assertEntityMaterial(materialId, 'text/html');
    }

    return await this.repo.materials.createAnnotation(materialId, annotation);
  }

  async queryAnnotations(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    return await this.repo.materials.findAllAnnotations(materialId);
  }

  async removeAnnotation(annotationId: AnnotationVO['id']) {
    await this.assertValidAnnotation(annotationId);
    const result = await this.repo.materials.removeAnnotation(annotationId);

    if (!result) {
      throw new Error('invalid annotation');
    }

    await this.repo.materials.update(result.materialId, { userUpdatedAt: Date.now() });
  }

  async updateAnnotation(annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    await this.assertValidAnnotation(annotationId);
    const updated = await this.repo.materials.updateAnnotation(annotationId, patch);

    if (!updated) {
      throw new Error('invalid id');
    }
    await this.repo.materials.update(updated.materialId, { userUpdatedAt: updated.updatedAt });

    // if (typeof patch.comment === 'string') {
    // this.contentService.processContent({
    //   content: patch.comment,
    //   entityType: EntityTypes.Material,
    //   entityId: annotationId,
    // });
    // }

    return updated;
  }

  async assertAvailableIds(ids: MaterialVO['id'][], type?: MaterialTypes) {
    const uniqueIds = uniq(ids);
    const rows = await this.repo.materials.findAll({ id: uniqueIds, isAvailable: true });
    const result =
      rows.length === uniqueIds.length &&
      (type ? rows.every(type === MaterialTypes.Entity ? isEntityMaterial : isDirectory) : true);

    if (!result) {
      throw new Error('invalid material id');
    }
  }

  private async assertEntityMaterial(materialId: MaterialVO['id'] | MaterialVO['id'][], mimeType?: string) {
    const ids = Array.isArray(materialId) ? uniq(materialId) : [materialId];
    const materials = await this.repo.materials.findAll({ id: ids, isAvailable: true });

    if (
      materials.length !== ids.length ||
      materials.some((material) => !isEntityMaterial(material) || (mimeType && material.mimeType !== mimeType))
    ) {
      throw new Error('invalid material id');
    }
  }

  private async assertValidAnnotation(annotationId: AnnotationVO['id']) {
    const annotation = await this.repo.materials.findAnnotationById(annotationId);

    if (!annotation) {
      throw new Error('invalid annotation id');
    }

    await this.assertEntityMaterial(annotation.materialId);
  }

  async getTreeFragment(materialId: Material['id'], type?: MaterialTypes) {
    await this.assertAvailableIds([materialId]);

    const ancestorIds = (await this.repo.materials.findAncestorIds([materialId]))[materialId] || [];
    const childrenIds = Object.values(await this.repo.materials.findChildrenIds(ancestorIds)).flat();

    const roots = await this.queryVO({ parentId: null, type });
    const children = await this.queryVO({ id: childrenIds, type });

    return [...roots, ...children];
  }
}
