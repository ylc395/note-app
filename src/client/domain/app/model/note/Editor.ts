import { makeObservable, computed, observable, action } from 'mobx';

import { IS_DEV } from '@shared/domain/infra/constants';
import Editor from '@domain/app/model/abstract/Editor';
import type Tile from '@domain/app/model/workbench/Tile';
import { normalizeTitle } from '@shared/domain/model/note';

import type EditableNote from './Editable';

interface UIState {
  scrollTop: number;
  selection: unknown;
  titleSelection: [number, number]; // todo: maintain this state
}

export default class NoteEditor extends Editor<EditableNote, UIState> {
  constructor(editable: EditableNote, tile: Tile) {
    super(editable, tile);
    makeObservable(this);
  }

  @observable
  public searchEnabled = false;

  @computed
  public get tabView() {
    return {
      title:
        (IS_DEV ? `${this.id} ${this.editable.entityId.slice(0, 3)} ` : '') +
        (this.editable.entity ? normalizeTitle(this.editable.entity.info) : ''),
      icon: this.editable.entity?.info.icon || null,
      breadcrumbs: this.editable.entity?.info.path || [],
    };
  }

  @computed
  public get title() {
    return this.editable.entity?.info.title;
  }

  @action.bound
  public toggleSearch() {
    this.searchEnabled = !this.searchEnabled;
  }

  public updateTitle(title: string) {
    this.editable.update({ title });
  }

  public readonly updateBody = (body: string) => {
    this.editable.updateBody(body);
  };

  @computed
  public get isReadonly() {
    return this.editable.entity?.info.isReadonly;
  }

  @computed
  public get body() {
    return this.editable.entity?.body;
  }

  @computed
  public get isEmpty() {
    return this.title === '' && this.body === '';
  }
}
