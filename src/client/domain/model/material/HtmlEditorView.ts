import { makeObservable, observable } from 'mobx';

import EditorView from 'model/material/EditorView';
import type HtmlEditor from './HtmlEditor';
import type Tile from 'model/workbench/Tile';

interface State {
  scrollOffset: number;
}

export default class HtmlEditorView extends EditorView<HtmlEditor, State> {
  constructor(tile: Tile, editor: HtmlEditor) {
    super(tile, editor, { scrollOffset: 0 });
    makeObservable(this);
  }

  @observable.ref
  documentElement?: unknown;
}
