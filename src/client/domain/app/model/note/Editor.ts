import { makeObservable, computed, observable, action } from 'mobx';

import Editor from '@domain/app/model/abstract/Editor';
import type Tile from '@domain/app/model/workbench/Tile';
import { type NotePatchDTO, normalizeTitle } from '@shared/domain/model/note';

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

  protected normalizeTitle = normalizeTitle;

  @action.bound
  public toggleSearch() {
    this.searchEnabled = !this.searchEnabled;
  }

  @action.bound
  public updateInfo(info: NotePatchDTO) {
    this.editable.update(info);
    this.setActive();
  }

  @action.bound
  public readonly updateBody = (body: string) => {
    this.editable.updateBody(body);
    this.setActive();
  };

  @computed
  public get isReadonly() {
    return Boolean(this.editable.info?.isReadonly);
  }

  @computed
  public get body() {
    return this.editable.body || '';
  }
}
