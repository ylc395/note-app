import uniq from 'lodash/uniq';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import dayjs from 'dayjs';

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
} from 'model/material';
import { EntityTypes } from 'model/entity';
import { buildIndex, getIds, getLocators } from 'utils/collection';

import BaseService, { Transaction } from './BaseService';
import RecyclableService from './RecyclableService';
import EntityService from './EntityService';
import { isDirectory } from 'model/material';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create(newMaterial: NewMaterialDTO) {
    if (newMaterial.parentId) {
      await this.assertAvailableIds([newMaterial.parentId], MaterialTypes.Directory);
    }

    if (isNewMaterialEntity(newMaterial)) {
      if (!(await this.files.findOneById(newMaterial.fileId))) {
        throw new Error('invalid fileId');
      }

      const material = await this.materials.createEntity(newMaterial);
      return { ...material, name: normalizeTitle(material), isStar: false };
    } else {
      const directory = await this.materials.createDirectory(newMaterial);
      return { ...directory, name: normalizeTitle(directory), isStar: false, childrenCount: 0 };
    }
  }

  private async toVOs(materials: Material[]) {
    const parentIds = getIds(materials.filter(isDirectory));
    const children = await this.materials.findChildrenIds(parentIds, { isAvailable: true });
    const stars = buildIndex(await this.stars.findAllByLocators(getLocators(materials, EntityTypes.Note)), 'entityId');

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
    const materials = await this.materials.findAll({ ...(typeof q === 'string' ? { id: [q] } : q), isAvailable: true });
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

    const result = await this.materials.update(ids, {
      ...patch,
      ...(typeof patch.name === 'undefined' ? null : { updatedAt: dayjs().unix() }),
    });

    return this.toVOs(result);
  }

  private async assertValidParent(parentId: Material['id'], childrenIds: Material['id'][]) {
    await this.assertAvailableIds([parentId], MaterialTypes.Directory);

    const descants = await this.materials.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      if (parentId === id || descants[id]?.includes(parentId)) {
        throw new Error('invalid new parent id');
      }
    }
  }

  async getTitles(ids: Material['id'][]) {
    const notes = await this.materials.findAll({ id: ids });
    return mapValues(buildIndex(notes), normalizeTitle);
  }

  async getBlob(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    const blob = await this.materials.findBlobById(materialId);

    if (blob === null) {
      throw new Error('no file');
    }

    return blob;
  }

  @Transaction
  async createAnnotation(materialId: MaterialVO['id'], annotation: NewAnnotationDTO) {
    if (annotation.type === AnnotationTypes.PdfRange || annotation.type === AnnotationTypes.PdfArea) {
      await this.assertEntityMaterial(materialId, 'application/pdf');
    }

    if (annotation.type === AnnotationTypes.HtmlRange) {
      await this.assertEntityMaterial(materialId, 'text/html');
    }

    return await this.materials.createAnnotation(materialId, annotation);
  }

  async queryAnnotations(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    return await this.materials.findAllAnnotations(materialId);
  }

  @Transaction
  async removeAnnotation(annotationId: AnnotationVO['id']) {
    await this.assertValidAnnotation(annotationId);
    const result = await this.materials.removeAnnotation(annotationId);

    if (!result) {
      throw new Error('invalid annotation');
    }

    await this.materials.update(result.materialId, { userUpdatedAt: dayjs().unix() });
  }

  @Transaction
  async updateAnnotation(annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    await this.assertValidAnnotation(annotationId);
    const updated = await this.materials.updateAnnotation(annotationId, patch);

    if (!updated) {
      throw new Error('invalid id');
    }
    await this.materials.update(updated.materialId, { userUpdatedAt: updated.updatedAt });

    return updated;
  }

  async assertAvailableIds(ids: MaterialVO['id'][], type?: MaterialTypes) {
    const uniqueIds = uniq(ids);
    const rows = await this.materials.findAll({ id: uniqueIds, isAvailable: true });
    const result =
      rows.length === uniqueIds.length &&
      (type ? rows.every(type === MaterialTypes.Entity ? isEntityMaterial : isDirectory) : true);

    if (!result) {
      throw new Error('invalid material id');
    }
  }

  private async assertEntityMaterial(materialId: MaterialVO['id'] | MaterialVO['id'][], mimeType?: string) {
    const ids = Array.isArray(materialId) ? uniq(materialId) : [materialId];
    const materials = await this.materials.findAll({ id: ids, isAvailable: true });

    if (
      materials.length !== ids.length ||
      materials.some((material) => !isEntityMaterial(material) || (mimeType && material.mimeType !== mimeType))
    ) {
      throw new Error('invalid material id');
    }
  }

  private async assertValidAnnotation(annotationId: AnnotationVO['id']) {
    const annotation = await this.materials.findAnnotationById(annotationId);

    if (!annotation) {
      throw new Error('invalid annotation id');
    }

    await this.assertEntityMaterial(annotation.materialId);
  }

  async getTreeFragment(materialId: Material['id'], type?: MaterialTypes) {
    await this.assertAvailableIds([materialId]);

    const ancestorIds = await this.materials.findAncestorIds(materialId);
    const childrenIds = Object.values(await this.materials.findChildrenIds(ancestorIds)).flat();

    const roots = await this.queryVO({ parentId: null, type });
    const children = await this.queryVO({ id: childrenIds, type });

    return [...roots, ...children];
  }
}
