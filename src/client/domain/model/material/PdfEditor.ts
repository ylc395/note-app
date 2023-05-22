import { computed, makeObservable, observable, runInAction } from 'mobx';
import uniq from 'lodash/uniq';
import groupBy from 'lodash/groupBy';

import { EntityTypes } from 'interface/entity';
import { type EntityMaterialVO, type HighlightDTO, type HighlightVO, normalizeTitle } from 'interface/material';
import Editor, { type CommonEditorEvents } from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

interface Entity {
  metadata: EntityMaterialVO;
  blob: ArrayBuffer;
}

export enum Events {
  HighlightCreated = 'pdfEditor.highlight.created',
}

export enum HighlightColors {
  Yellow = '#2596be',
  Red = '#ef0005',
  Blue = '#0008ef',
  Purple = '#b000ef',
  Gray = '#a2a2a2',
}

interface PdfEditorEvents extends CommonEditorEvents {
  [Events.HighlightCreated]: [HighlightVO];
}

export default class PdfEditor extends Editor<Entity, PdfEditorEvents> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
    this.init();
  }

  readonly entityType = EntityTypes.Material;

  @observable
  readonly highlights: HighlightVO[] = [];

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

    const { body: highlights } = await this.remote.get<unknown, HighlightVO[]>(
      `/materials/${this.entityId}/highlights`,
    );

    runInAction(() => {
      this.highlights.push(...highlights);
    });
  }

  @computed
  get tabView() {
    return {
      title: this.entity ? normalizeTitle(this.entity.metadata) : '',
      icon: this.entity?.metadata.icon || null,
    };
  }

  async createHighlight(highlight: HighlightDTO) {
    const { body: createdHighlight } = await this.remote.post<HighlightDTO, HighlightVO>(
      `/materials/${this.entityId}/highlights`,
      highlight,
    );

    this.highlights.push(createdHighlight);
    this.emit(Events.HighlightCreated, createdHighlight);
  }

  @computed
  get highlightedPages() {
    return uniq(this.highlights.flatMap(({ fragments }) => fragments.map(({ page }) => page)));
  }

  @computed
  private get highlightFragmentsByGroup() {
    const fragments = this.highlights.flatMap(({ fragments, color }) => {
      return fragments.map(({ page, rect }) => ({ page, rect, color, highlightId: JSON.stringify(rect) }));
    });

    return groupBy(fragments, 'page');
  }

  getHighlightFragmentsOfPage(page: number) {
    return this.highlightFragmentsByGroup[page];
  }
}
