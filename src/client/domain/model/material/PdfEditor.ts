import { computed, makeObservable, observable } from 'mobx';
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
  [Events.HighlightCreated]: [HighlightDTO];
}

export default class PdfEditor extends Editor<Entity, PdfEditorEvents> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
    makeObservable(this);
  }

  readonly entityType = EntityTypes.Material;

  @observable
  readonly highlights: HighlightVO[] = [];

  @computed
  get breadcrumbs() {
    return [];
  }

  @computed
  get tabView() {
    return {
      title: this.entity ? normalizeTitle(this.entity.metadata) : '',
      icon: this.entity?.metadata.icon || null,
    };
  }

  createHighlight(highlight: HighlightDTO) {
    this.emit(Events.HighlightCreated, highlight);
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
