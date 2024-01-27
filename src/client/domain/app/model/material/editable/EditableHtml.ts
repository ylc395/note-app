import { observable, runInAction, makeObservable } from 'mobx';

import type { EntityMaterialVO } from '@shared/domain/model/material';
import type { Tile } from '@domain/app/model/workbench';
import EditableMaterial from './EditableMaterial';
import HtmlEditor from '../editor/HtmlEditor';

export default class EditableHtml extends EditableMaterial {
  constructor(materialId: EntityMaterialVO['id']) {
    super(materialId);
    makeObservable(this);
  }

  public createEditor(tile: Tile) {
    return new HtmlEditor(this, tile);
  }

  @observable
  public html?: string;

  protected async load() {
    await super.load();

    const textDecoder = new TextDecoder();

    runInAction(() => {
      this.html = textDecoder.decode(this.blob);
    });
  }

  public destroy() {}
}
