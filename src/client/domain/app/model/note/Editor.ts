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
    this.setReadonly = editable.setReadonly;
    this.submitNewVersion = editable.submitNewVersion;
    makeObservable(this);
  }

  @observable
  public searchEnabled = false;

  protected normalizeTitle = normalizeTitle;

  public readonly setReadonly: (value: boolean) => void;

  public readonly submitNewVersion: () => Promise<void>;

  @action.bound
  public toggleSearch() {
    this.searchEnabled = !this.searchEnabled;
  }

  @action.bound
  public updateEntity(info: NotePatchDTO) {
    this.editable.update(info);
    this.setIsEditing();
  }

  @action.bound
  public readonly updateBody = (body: string) => {
    this.updateEntity({ body });
  };

  @computed
  public get isReadonly() {
    return this.editable.isReadonly;
  }

  @computed
  public get canSubmitNewVersion() {
    return this.editable.canSubmitVersion;
  }

  @computed
  public get body() {
    return this.editable.entity?.body;
  }
}
