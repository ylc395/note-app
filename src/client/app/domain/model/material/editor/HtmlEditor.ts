import { makeObservable, observable, action } from 'mobx';

import MaterialEditor from 'model/material/editor/MaterialEditor';
import type Tile from 'model/workbench/Tile';
import type EditableHtml from '../editable/EditableHtml';

interface State {
  scrollTop: number;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditor extends MaterialEditor<EditableHtml, State> {
  constructor(tile: Tile, editor: EditableHtml) {
    super(tile, editor);
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
}
