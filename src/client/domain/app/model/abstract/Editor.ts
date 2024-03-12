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
    this.createAnnotation = editable.createAnnotation;
    this.getAnnotation = editable.getAnnotation;
    this.updateAnnotation = editable.updateAnnotation;
  }

  public readonly id = uniqueId('editor-');
  private readonly localStorage = container.resolve(localStorageToken);
  protected abstract normalizeTitle(v: unknown): string;

  public get entityLocator(): EditableEntityLocator {
    return this.editable.entityLocator;
  }

  @observable.ref
  public tile: Tile;

  @observable
  public isEditing = false;

  @action.bound
  public setIsEditing() {
    this.isEditing = true;
  }

  private get uiStateKey() {
    return `UI_STATE_${this.entityLocator.entityId}`;
  }

  @computed
  public get info() {
    return this.editable.entity as T['entity'] | undefined;
  }

  @computed
  public get annotations() {
    return this.editable.annotations;
  }

  public readonly createAnnotation: T['createAnnotation'];
  public readonly updateAnnotation: T['updateAnnotation'];
  public readonly getAnnotation: T['getAnnotation'];

  @computed
  public get tabView() {
    return {
      title:
        (IS_DEV ? `${this.id} ${this.entityLocator.entityId.slice(0, 3)} ` : '') +
        (this.editable.entity ? this.normalizeTitle(this.editable.entity) : ''),
      icon: this.editable.entity?.icon || null,
      breadcrumbs: this.editable.path || [],
    };
  }

  public uiState: Partial<S> | null = null;

  @action.bound
  public updateUIState(state: Partial<S>) {
    this.uiState = { ...this.uiState, ...state };
    this.localStorage.set(this.uiStateKey, this.uiState);
  }
}
