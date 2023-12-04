import { makeObservable, computed, observable, action } from 'mobx';

import { IS_DEV } from '@domain/infra/constants';
import Editor from '@domain/model/abstract/Editor';
import type Tile from '@domain/model/workbench/Tile';
import { normalizeTitle } from '@domain/model/note';

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
  get breadcrumbs() {
    return this.editable.entity?.path || [];
  }

  @computed
  get tabView() {
    return {
      title:
        (IS_DEV ? `${this.id} ${this.editable.entityId.slice(0, 3)} ` : '') +
        (this.editable.entity ? normalizeTitle(this.editable.entity) : ''),
      icon: this.editable.entity?.icon || null,
    };
  }

  @computed
  get title() {
    return this.editable.entity?.title;
  }

  @action.bound
  toggleSearch() {
    this.searchEnabled = !this.searchEnabled;
  }

  updateTitle(title: string) {
    this.editable.update({ title });
  }

  updateBody(body: string) {
    this.editable.update({ body });
  }

  @computed
  get isReadonly() {
    return this.editable.entity?.isReadonly;
  }

  @computed
  get body() {
    return this.editable.entity?.body;
  }
}
