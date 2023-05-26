import { computed, makeObservable, observable, runInAction } from 'mobx';
import groupBy from 'lodash/groupBy';

import { EntityTypes } from 'interface/entity';
import {
  type EntityMaterialVO,
  type AnnotationVO,
  type HighlightVO,
  type AnnotationDTO,
  type HighlightAreaVO,
  normalizeTitle,
  AnnotationTypes,
} from 'interface/material';
import Editor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

interface Entity {
  metadata: EntityMaterialVO;
  blob: ArrayBuffer;
}

export enum HighlightColors {
  Yellow = '#2596be',
  Red = '#ef0005',
  Blue = '#0008ef',
  Purple = '#b000ef',
  Gray = '#a2a2a2',
}

export default class PdfEditor extends Editor<Entity> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
    this.init();
  }

  readonly entityType = EntityTypes.Material;

  @observable
  private readonly annotations: AnnotationVO[] = [];

  @computed
  get highlights() {
    return this.annotations
      .map(({ annotation, id, type }) => {
        if (type === AnnotationTypes.Highlight) {
          const pages = annotation.fragments.map(({ page }) => page);

          return { id, annotation, type, startPage: Math.min(...pages), endPage: Math.max(...pages) };
        }

        if (type === AnnotationTypes.HighlightArea) {
          return { id, annotation, type, startPage: annotation.page, endPage: annotation.page };
        }

        throw new Error('invalid type');
      })
      .sort(({ startPage: startPage1 }, { startPage: startPage2 }) => startPage1 - startPage2);
  }

  @computed
  get breadcrumbs() {
    return [];
  }

  private async init() {
    const [{ body: metadata }, { body: blob }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, ArrayBuffer>(`/materials/${this.entityId}/blob`),
    ]);

    this.load({ metadata, blob });

    const { body: annotations } = await this.remote.get<unknown, AnnotationVO[]>(
      `/materials/${this.entityId}/annotations`,
    );

    runInAction(() => {
      this.annotations.push(...annotations);
    });
  }

  @computed
  get tabView() {
    return {
      title: this.entity ? normalizeTitle(this.entity.metadata) : '',
      icon: this.entity?.metadata.icon || null,
    };
  }

  async createAnnotation(annotation: AnnotationDTO) {
    const { body: createdAnnotation } = await this.remote.post<AnnotationDTO, AnnotationVO>(
      `/materials/${this.entityId}/annotations`,
      annotation,
    );

    runInAction(() => {
      this.annotations.push(createdAnnotation);
    });
  }

  @computed
  get highlightFragmentsByPage() {
    const highlights = this.annotations
      .filter(({ type }) => type === AnnotationTypes.Highlight)
      .map(({ annotation, id }) => ({ ...(annotation as HighlightVO), annotationId: id }));

    const fragments = highlights.flatMap(({ fragments, color, annotationId }) => {
      return fragments.map(({ page, rect }) => ({
        annotationId,
        page,
        rect,
        color,
        highlightId: `${annotationId}-${JSON.stringify(rect)}`,
      }));
    });

    return groupBy(fragments, 'page');
  }

  @computed
  get highlightAreasByPage() {
    const highlightAreas = this.annotations
      .filter(({ type }) => type === AnnotationTypes.HighlightArea)
      .map(({ annotation, id }) => ({ ...(annotation as HighlightAreaVO), id }));

    return groupBy(highlightAreas, 'page');
  }
}
