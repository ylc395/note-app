import uniq from 'lodash/uniq';
import negate from 'lodash/negate';
import compact from 'lodash/compact';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  type AnnotationDTO,
  type MaterialDTO,
  type ClientMaterialQuery,
  type MaterialVO,
  type AnnotationVO,
  type AnnotationPatchDTO,
  type Material,
  AnnotationTypes,
  isDirectory,
  MaterialTypes,
  isEntityMaterial,
  normalizeTitle,
} from 'model/material';
import { EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import RecyclableService from './RecyclableService';
import { buildIndex, getIds, getLocators } from 'utils/collection';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;

  async create({ file, fileId, ...info }: MaterialDTO) {
    if (file && fileId) {
      throw new Error('invalid material');
    }

    if ((file || fileId) && !info.parentId) {
      throw new Error('empty parentId');
    }

    if (file && !file.data && !file.path) {
      throw new Error('invalid file');
    }

    if (info.parentId && !(await this.areAvailable([info.parentId], MaterialTypes.Directory))) {
      throw new Error('invalid parent id');
    }

    if (file || fileId) {
      return { ...(await this.materials.createEntity({ file, fileId, ...info })), isStar: false };
    }

    return { ...(await this.materials.createDirectory(info)), isStar: false, childrenCount: 0 };
  }

  private async addInfo(materials: Material[]) {
    const children = await this.getChildren(getIds(materials.filter(isDirectory)));
    const stars = buildIndex(await this.stars.findAllByLocators(getLocators(materials, EntityTypes.Note)), 'entityId');

    return materials.map((material) => ({
      ...material,
      isStar: Boolean(stars[material.id]),
      name: normalizeTitle(material),
      ...(isDirectory(material) ? { childrenCount: children[material.id]?.length || 0 } : null),
    }));
  }

  private async getChildren(materialIds: Material['id'][]) {
    const children = await this.materials.findAllChildrenIds(materialIds);
    const availableChildren = await this.recyclableService.filterByLocators(children, (id) => ({
      id,
      type: EntityTypes.Material,
    }));

    return availableChildren;
  }

  async query(q: ClientMaterialQuery): Promise<MaterialVO[]>;
  async query(q: MaterialVO['id']): Promise<MaterialVO>;
  async query(q: ClientMaterialQuery | MaterialVO['id']): Promise<MaterialVO[] | MaterialVO> {
    const rows =
      typeof q === 'string' ? compact([await this.materials.findOneById(q)]) : await this.materials.findAll(q);
    const availableMaterials = await this.recyclableService.filter(EntityTypes.Material, rows);
    const materials = await this.addInfo(availableMaterials);

    const result = typeof q === 'string' ? materials[0] : materials;

    if (!result) {
      throw new Error('no result');
    }

    return result;
  }

  async getBlob(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    const blob = await this.materials.findBlobById(materialId);

    if (blob === null) {
      throw new Error('no file');
    }

    return blob;
  }

  async createAnnotation(materialId: MaterialVO['id'], annotation: AnnotationDTO) {
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

  async areAvailable(ids: MaterialVO['id'][], type?: MaterialTypes) {
    const uniqueIds = uniq(ids);
    const rows = await this.materials.findAll({ id: uniqueIds });

    if (rows.length !== ids.length) {
      return false;
    }

    if ((await this.recyclableService.filter(EntityTypes.Material, rows)).length !== rows.length) {
      return false;
    }

    if (type) {
      return rows.every(type === MaterialTypes.Directory ? isDirectory : negate(isDirectory));
    }

    return true;
  }

  private async assertEntityMaterial(materialId: MaterialVO['id'], mimeType?: string) {
    const material = await this.query(materialId);

    if (!isEntityMaterial(material) || (mimeType && material.mimeType !== mimeType)) {
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

  async getTreeFragment(id: MaterialVO['id']) {
    if (!(await this.areAvailable([id]))) {
      throw new Error('invalid id');
    }

    return [];
  }
}
