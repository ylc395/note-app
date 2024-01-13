import { uniqueId } from 'lodash-es';
import { action, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';

import { token as localStorageToken } from '@domain/app/infra/localStorage';
import type { Path } from '../entity';
import type EditableEntity from '../abstract/EditableEntity';
import type Tile from '../workbench/Tile';

export default abstract class Editor<T extends EditableEntity = EditableEntity, S = unknown> {
  constructor(protected readonly editable: T, tile: Tile) {
    makeObservable(this);
    this.uiState = this.localStorage.get(this.uiStateKey);
    this.tile = tile;
  }

  @observable.ref public tile: Tile;
  public readonly id = uniqueId('editor-');
  private readonly localStorage = container.resolve(localStorageToken);
  public abstract readonly tabView: { title: string; icon: string | null; breadcrumbs: Path };

  @observable public isActive = false;
  public uiState: Partial<S> | null = null;

  private get uiStateKey() {
    return `UI_STATE_${this.entityLocator.entityId}`;
  }

  public get entityLocator() {
    return this.editable.toEntityLocator();
  }

  @action.bound
  public updateUIState(state: Partial<S>) {
    this.uiState = { ...this.uiState, ...state };
    this.localStorage.set(this.uiStateKey, this.uiState);
  }
}
