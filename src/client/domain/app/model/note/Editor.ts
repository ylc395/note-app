import { makeObservable, computed, observable, action } from 'mobx';

import { IS_DEV } from '@shared/domain/infra/constants';
import Editor from '@domain/app/model/abstract/Editor';
import type Tile from '@domain/app/model/workbench/Tile';
import { normalizeTitle } from '@shared/domain/model/note';

import type EditableNote from './Editable';

interface UIState {
  scrollTop: number;
  selection: unknown;
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

  readonly updateBody = (body: string) => {
    this.editable.update({ body });
  };

  @computed
  get isReadonly() {
    return this.editable.entity?.isReadonly;
  }

  @computed
  get body() {
    return this.editable.entity?.body;
  }
}
