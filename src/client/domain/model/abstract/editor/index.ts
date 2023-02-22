import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { computed, makeObservable, observable, reaction, runInAction } from 'mobx';
import EventEmitter from 'eventemitter2';

import { token as remoteToken } from 'infra/Remote';
import type Tile from 'model/workbench/Tile';
import type { EntityId, EntityTypes } from 'interface/Entity';
import EntityManager, { EditableEntity } from './EntityManager';

interface Breadcrumb {
  title: string;
  id: string;
  icon?: string;
}

export type Breadcrumbs = Array<Breadcrumb & { siblings: Breadcrumb[] }>;

export enum Events {
  Destroyed = 'entityEditor.destroyed',
  Activated = 'entityEditor.activated',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class EntityEditor<T extends EditableEntity = any> extends EventEmitter {
  private readonly entityManager = container.resolve(EntityManager);
  protected remote = container.resolve(remoteToken);
  readonly id = uniqueId('editor-');
  abstract readonly title: string;
  abstract readonly entityType: EntityTypes;
  abstract readonly breadcrumbs: Breadcrumbs;
  private disposeReaction?: ReturnType<typeof reaction>;
  protected abstract fetchEntity(): Promise<T>;
  @observable.ref entity?: T;

  constructor(protected readonly tile: Tile, readonly entityId: EntityId) {
    super();
    makeObservable(this);
  }

  destroy() {
    this.entityManager.reduce(this.entityType, this.entityId);
    this.emit(Events.Destroyed);
    this.disposeReaction && this.disposeReaction();
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.tile.isFocused && this.tile.currentTab?.id === this.id;
  }

  protected async init() {
    const entity = (await this.entityManager.get(this.entityType, this.entityId, this.fetchEntity.bind(this))) as T;

    runInAction(() => (this.entity = entity));
    this.disposeReaction = reaction(
      () => this.isActive,
      (isActive) => isActive && this.emit(Events.Activated),
      { fireImmediately: true },
    );
  }
}
