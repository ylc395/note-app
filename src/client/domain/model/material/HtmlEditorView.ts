import { makeObservable, observable, action } from 'mobx';

import EditorView from 'model/material/EditorView';
import type HtmlEditor from './HtmlEditor';
import type Tile from 'model/workbench/Tile';

interface State {
  scrollTop: number;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditorView extends EditorView<HtmlEditor, State> {
  constructor(tile: Tile, editor: HtmlEditor) {
    super(tile, editor, { scrollTop: 0 });
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
