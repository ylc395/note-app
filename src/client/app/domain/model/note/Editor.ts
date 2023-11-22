import { makeObservable, computed, observable, action } from 'mobx';

import { IS_DEV } from 'infra/constants';
import Editor from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';

import type EditableNote from './Editable';

interface UIState {
  scrollTop: number;
  cursor: number;
}

export default class NoteEditor extends Editor<EditableNote, UIState> {
  constructor(editable: EditableNote, tile: Tile) {
    super(editable, tile);
    makeObservable(this);
  }

  @observable searchEnabled = false;

  @computed
  get tabView() {
    return {
      title: (IS_DEV ? `${this.id} ${this.editable.entityId.slice(0, 3)} ` : '') + this.editable.entity?.metadata.title,
      icon: this.editable.entity?.metadata.icon || null,
    };
  }

  @computed
  get title() {
    return this.editable.entity?.metadata.title;
  }

  @action.bound
  toggleSearch() {
    this.searchEnabled = !this.searchEnabled;
  }

  updateTitle(title: string) {
    this.editable.updateMetadata({ title });
  }

  updateBody(body: string) {
    this.editable.updateBody(body);
  }

  @computed
  get isReadonly() {
    return this.editable.entity?.metadata.isReadonly;
  }

  @computed
  get body() {
    return this.editable.entity?.body;
  }
}
