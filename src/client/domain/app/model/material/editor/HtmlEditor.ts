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
  public documentElement?: unknown;

  @observable
  public panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

  @action
  public togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }

  @computed
  public get html() {
    return this.editable.html;
  }
}
