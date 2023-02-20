import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import EventEmitter from 'eventemitter2';

import { token as remoteToken } from 'infra/Remote';
import type Window from 'model/windowManager/Window';
import type { EntityId, EntityTypes } from 'interface/Entity';

import type { Entity as NoteEditorEntity } from './NoteEditor';

type EditableEntity = NoteEditorEntity;

const entitiesMap: Record<string, { entity?: EditableEntity | Promise<EditableEntity>; count: number }> = {};

export enum Events {
  Destroyed = 'entityEditor.destroyed',
}

export default abstract class EntityEditor<T extends EditableEntity> extends EventEmitter {
  protected remote = container.resolve(remoteToken);
  readonly id = uniqueId('editor-');
  abstract readonly title: string;
  abstract readonly entityType: EntityTypes;
  protected abstract fetchEntity(): Promise<T>;
  @observable.ref entity?: T;

  constructor(protected readonly window: Window, readonly entityId: EntityId) {
    super();
    makeObservable(this);
  }

  destroy() {
    const key = this.entityKey;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = entitiesMap[key]!;

    record.count -= 1;

    if (record.count === 0) {
      delete entitiesMap[key];
    }

    this.emit(Events.Destroyed);
    this.removeAllListeners();
  }

  @computed
  get isActive() {
    return this.window.isFocused && this.window.currentTab?.id === this.id;
  }

  private get entityKey() {
    return `${this.entityType}-${this.entityId}`;
  }

  protected async init() {
    const key = this.entityKey;

    if (!entitiesMap[key]) {
      entitiesMap[key] = { count: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = entitiesMap[key]!;

    record.count += 1;

    if (record.entity) {
      this.entity = (record.entity instanceof Promise ? await record.entity : record.entity) as T;
    } else {
      record.entity = new Promise((resolve) => {
        this.fetchEntity().then((entity) => {
          const result = observable(entity);

          runInAction(() => (this.entity = result));
          record.entity = result;
          resolve(result);
        });
      });
    }
  }
}
