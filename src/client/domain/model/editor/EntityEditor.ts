import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import EventEmitter from 'eventemitter2';

import { token as remoteToken } from 'infra/Remote';
import type Window from 'model/windowManager/Window';
import type { EntityId, EntityTypes } from 'interface/Entity';

import type { Entity as NoteEditorEntity } from './NoteEditor';

type EditableEntity = NoteEditorEntity;

const entitiesMap: Record<string, { entity: Promise<EditableEntity>; count: number }> = {};

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

export default abstract class EntityEditor<T = unknown> extends EventEmitter {
  protected remote = container.resolve(remoteToken);
  readonly id = uniqueId('editor-');
  abstract readonly title: string;
  protected abstract readonly entityType: EntityTypes;
  protected abstract fetchEntity(): Promise<T>;
  @observable entity?: T;

  constructor(protected readonly window: Window, readonly entityId: EntityId) {
    super();
    makeObservable(this);
    this.loadEntity();
  }

  destroy() {
    const key = this.entityKey;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entitiesMap[key]!.count -= 1;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (entitiesMap[key]!.count === 0) {
      delete entitiesMap[key];
    }

    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.window.currentTab?.editor.id === this.id;
  }

  private get entityKey() {
    return `${this.entityType}-${this.entityId}`;
  }

  private async loadEntity() {
    const key = this.entityKey;

    if (!entitiesMap[key]) {
      entitiesMap[key] = {
        entity: this.fetchEntity() as Promise<EditableEntity>,
        count: 0,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entitiesMap[key]!.count += 1;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entity = (await entitiesMap[key]!.entity) as T;
    runInAction(() => (this.entity = entity));
  }
}
