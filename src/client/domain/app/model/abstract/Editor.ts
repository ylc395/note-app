import { uniqueId } from 'lodash-es';
import { action, makeObservable, observable } from 'mobx';
import { Emitter } from 'strict-event-emitter';
import { container } from 'tsyringe';

import { token as localStorageToken } from '@domain/app/infra/localStorage';
import type { Path } from '../entity';
import type EditableEntity from '../abstract/EditableEntity';
import type Tile from '../workbench/Tile';

export enum EventNames {
  Destroyed = 'editor.destroyed',
  Focus = 'editor.focus',
}

type Events = {
  [EventNames.Destroyed]: [];
  [EventNames.Focus]: [];
};

export default abstract class Editor<T extends EditableEntity = EditableEntity, S = unknown> extends Emitter<Events> {
  public readonly id = uniqueId('editor-');
  private readonly localStorage = container.resolve(localStorageToken);
  public abstract readonly tabView: { title: string; icon: string | null; breadcrumbs: Path };

  @observable isFocused = false;
  @observable isActive = false;
  public uiState: Partial<S> | null = null;

  private get uiStateKey() {
    return `UI_STATE_${this.entityLocator.entityId}`;
  }

  constructor(protected readonly editable: T, public tile?: Tile) {
    super();
    makeObservable(this);

    this.uiState = this.localStorage.get(this.uiStateKey);
  }

  public get entityLocator() {
    return this.editable.toEntityLocator();
  }

  public destroy() {
    this.emit(EventNames.Destroyed);
    this.removeAllListeners();
  }

  @action.bound
  public blur() {
    console.log(`blur ${this.id}`);
    this.isFocused = false;
  }

  @action.bound
  public focus() {
    if (this.isFocused) {
      return;
    }

    console.log(`focus ${this.id}`);
    this.emit(EventNames.Focus);
    this.isFocused = true;
  }

  @action.bound
  public updateUIState(state: Partial<S>) {
    this.uiState = { ...this.uiState, ...state };
    this.localStorage.set(this.uiStateKey, this.uiState);
  }
}
