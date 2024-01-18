import { uniqueId } from 'lodash-es';
import { action, computed, makeObservable, observable } from 'mobx';
import { container } from 'tsyringe';

import { IS_DEV } from '@shared/domain/infra/constants';
import { token as localStorageToken } from '@domain/app/infra/localStorage';
import type { default as EditableEntity, EditableEntityLocator } from '../abstract/EditableEntity';
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

  @observable public isActive = false;
  public uiState: Partial<S> | null = null;

  @action.bound
  public setActive() {
    this.isActive = true;
  }

  private get uiStateKey() {
    return `UI_STATE_${this.entityLocator.entityId}`;
  }

  @computed
  public get title() {
    return this.editable.info?.title;
  }

  protected abstract normalizeTitle(v: unknown): string;

  @computed
  public get icon() {
    return this.editable.info?.icon || null;
  }

  @computed
  public get tabView() {
    return {
      title:
        (IS_DEV ? `${this.id} ${this.entityLocator.entityId.slice(0, 3)} ` : '') +
        (this.editable.info ? this.normalizeTitle(this.editable.info) : ''),
      icon: this.icon,
      breadcrumbs: this.editable.info?.path || [],
    };
  }

  @computed
  public get entityLocator(): EditableEntityLocator {
    return this.editable.entityLocator;
  }

  @action.bound
  public updateUIState(state: Partial<S>) {
    this.uiState = { ...this.uiState, ...state };
    this.localStorage.set(this.uiStateKey, this.uiState);
  }
}
