import uniq from 'lodash/uniq';
import negate from 'lodash/negate';
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
  normalizeTitle,
} from 'model/material';
import { EntityTypes } from 'model/entity';
import { buildIndex, getIds, getLocators } from 'utils/collection';

import BaseService from './BaseService';
import RecyclableService from './RecyclableService';
import EntityService from './EntityService';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create({ fileId, ...info }: NewMaterialDTO) {
    if (info.parentId) {
      await this.assertAvailableIds([info.parentId], MaterialTypes.Directory);
    }

    if (fileId) {
      if (!(await this.files.findOneById(fileId))) {
        throw new Error('invalid fileId');
      }

      const material = await this.materials.createEntity({ fileId, ...info });
      return { ...material, name: normalizeTitle(material), isStar: false };
    }

    const directory = await this.materials.createDirectory(info);

    return { ...directory, name: normalizeTitle(directory), isStar: false, childrenCount: 0 };
  }

  private async toVOs(materials: Material[]) {
    const parentIds = getIds(materials.filter(negate(isEntityMaterial)));
    const children = await this.getChildrenIds(parentIds);
    const stars = buildIndex(await this.stars.findAllByLocators(getLocators(materials, EntityTypes.Note)), 'entityId');

    return materials.map((material) => ({
      ...material,
      isStar: Boolean(stars[material.id]),
      name: normalizeTitle(material),
      ...(isEntityMaterial(material) ? null : { childrenCount: children[material.id]?.length || 0 }),
    })) as MaterialVO[];
  }

  private async getChildrenIds(materialIds: Material['id'][]) {
    const children = await this.materials.findChildrenIds(materialIds);
    const availableChildren = await this.recyclableService.filterByLocators(children, (id) => ({
      id,
      type: EntityTypes.Material,
    }));

    return availableChildren;
  }

  private async queryAvailableMaterials(q: MaterialQuery) {
    const materials = await this.materials.findAll(q);
    const availableMaterials = await this.recyclableService.filter(EntityTypes.Material, materials);

    return availableMaterials;
  }

  async queryVO(q: MaterialQuery): Promise<MaterialVO[]>;
  async queryVO(q: MaterialVO['id']): Promise<MaterialVO>;
  async queryVO(q: MaterialQuery | MaterialVO['id']): Promise<MaterialVO[] | MaterialVO> {
    const materials = await this.queryAvailableMaterials(typeof q === 'string' ? { id: [q] } : q);
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
      await this.entityService.assertValidParent(EntityTypes.Material, patch.parentId, ids);
    }

    const result = await this.materials.update(ids, {
      ...patch,
      ...(typeof patch.name === 'undefined' ? null : { updatedAt: dayjs().unix() }),
    });

    return this.toVOs(result);
  }

  async getBlob(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    const blob = await this.materials.findBlobById(materialId);

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

    return await this.materials.createAnnotation(materialId, annotation);
  }

  async queryAnnotations(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    return await this.materials.findAllAnnotations(materialId);
  }

  async removeAnnotation(annotationId: AnnotationVO['id']) {
    await this.assertValidAnnotation(annotationId);
    const result = await this.materials.removeAnnotation(annotationId);

    if (!result) {
      throw new Error('invalid annotation');
    }
  }

  async updateAnnotation(annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    await this.assertValidAnnotation(annotationId);
    const updated = await this.materials.updateAnnotation(annotationId, patch);

    if (!updated) {
      throw new Error('invalid id');
    }

    return updated;
  }

  async assertAvailableIds(ids: MaterialVO['id'][], type?: MaterialTypes) {
    const uniqueIds = uniq(ids);
    const rows = await this.queryAvailableMaterials({ id: uniqueIds });
    const result =
      rows.length === uniqueIds.length &&
      (type ? rows.every(type === MaterialTypes.Entity ? isEntityMaterial : negate(isEntityMaterial)) : true);

    if (!result) {
      throw new Error('invalid material id');
    }
  }

  private async assertEntityMaterial(materialId: MaterialVO['id'] | MaterialVO['id'][], mimeType?: string) {
    const ids = Array.isArray(materialId) ? uniq(materialId) : [materialId];
    const materials = await this.queryAvailableMaterials({ id: ids });

    if (
      materials.length !== ids.length ||
      materials.every((material) => isEntityMaterial(material) && (mimeType ? material.mimeType === mimeType : true))
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

    return EntityService.getTree(roots, children);
  }
}
