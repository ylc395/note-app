import { observable, action, computed } from 'mobx';

import type Tile from '#domain/client/app/model/workbench/Tile';
import EditableMaterial from '../editable/EditableMaterial';
import MaterialEditor from './MaterialEditor';

interface State {
  scrollTop: number;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditor extends MaterialEditor<State> {
  constructor(editable: EditableMaterial, tile: Tile) {
    super(editable, tile);
  }

  @observable.ref public documentElement?: unknown;

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
    if (!this.editable.blob) {
      return undefined;
    }

    const textDecoder = new TextDecoder();
    return textDecoder.decode(this.editable.blob);
  }
}
