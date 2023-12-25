import { makeObservable, observable, action, computed } from 'mobx';

import MaterialEditor from '@domain/app/model/material/editor/MaterialEditor';
import type Tile from '@domain/app/model/workbench/Tile';
import type EditableHtml from '../editable/EditableHtml';

interface State {
  scrollTop: number;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditor extends MaterialEditor<EditableHtml, State> {
  constructor(editor: EditableHtml, tile: Tile) {
    super(editor, tile);
    makeObservable(this);
  }

  @observable.ref
  documentElement?: unknown;

  @observable panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

  @action
  togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }

  @computed
  get metadata() {
    if (!this.editable.entity) {
      return null;
    }

    const { icon, sourceUrl } = this.editable.entity.metadata;

    return { icon, sourceUrl };
  }

  @computed
  get html() {
    return this.editable.entity?.html;
  }
}
