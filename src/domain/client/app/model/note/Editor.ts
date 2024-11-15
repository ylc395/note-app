import { computed, action } from 'mobx';

import { IS_DEV } from '#domain/shared/infra/constants';
import Editor from '#domain/client/app/model/abstract/Editor';
import type Tile from '#domain/client/app/model/workbench/Tile';
import { normalizeTitle, type NotePatchDTO } from '#domain/shared/model/note';

import type EditableNote from './Editable';

interface UIState {
  isReadonly: boolean;
  scrollTop: number;
  selection: unknown;
  titleSelection: [number, number]; // todo: maintain this state
}

export default class NoteEditor extends Editor<EditableNote, UIState> {
  constructor(editable: EditableNote, tile: Tile) {
    super(editable, tile);
  }

  public toggleReadonly() {
    this.uiState.update({ isReadonly: !this.uiState.value?.isReadonly });
  }

  @action.bound
  public update(info: NotePatchDTO) {
    this.editable.update(info);
  }

  @computed
  public get body() {
    return this.editable.entity?.body;
  }

  @computed
  public get view() {
    const titlePrefix = IS_DEV ? `${this.id} ${this.entityLocator.entityId.slice(0, 3)} ` : '';

    return {
      title: titlePrefix + (this.editable.entity ? normalizeTitle(this.editable.entity) : ''),
      breadcrumbs: this.editable.path || [],
      icon: this.editable.entity?.icon || null,
    };
  }
}
