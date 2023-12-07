import { uniqueId } from 'lodash-es';
import { action, makeObservable, observable } from 'mobx';
import { Emitter } from 'strict-event-emitter';

import type { Path } from '@domain/model/entity';
import type EditableEntity from '@domain/model/abstract/EditableEntity';
import type Tile from '@domain/model/workbench/Tile';

export enum EventNames {
  Destroyed = 'editor.destroyed',
  Focus = 'editor.focus',
  UIUpdated = 'editor.uiUpdated',
}

type Events<S> = {
  [EventNames.Destroyed]: [];
  [EventNames.UIUpdated]: [Partial<S>];
  [EventNames.Focus]: [];
};

export default abstract class Editor<T extends EditableEntity = EditableEntity, S = unknown> extends Emitter<
  Events<S>
> {
  readonly id = uniqueId('editor-');
  abstract readonly tabView: { title: string; icon: string | null };
  abstract readonly breadcrumbs: Path;
  @observable isFocused = false;
  uiState: Partial<S> | null = null;

  constructor(protected readonly editable: T, public tile?: Tile) {
    super();
    makeObservable(this);
  }

  toEntityLocator() {
    return this.editable.toEntityLocator();
  }

  destroy() {
    this.emit(EventNames.Destroyed);
    this.removeAllListeners();
  }

  @action.bound
  blur() {
    console.log(`blur ${this.id}`);
    this.isFocused = false;
  }

  @action.bound
  focus() {
    console.log(`focus ${this.id}`);
    this.emit(EventNames.Focus);
    this.isFocused = true;
  }

  @action
  updateUIState(state: Partial<S>) {
    this.uiState = { ...this.uiState, ...state };
    this.emit(EventNames.UIUpdated, state);
  }
}
