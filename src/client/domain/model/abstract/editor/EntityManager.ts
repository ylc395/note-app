import { singleton } from 'tsyringe';
import { observable } from 'mobx';

import type { EntityId, EntityTypes } from 'interface/Entity';
import type { Entity as NoteEditorEntity } from '../../note/Editor';

export type EditableEntity = NoteEditorEntity;

@singleton()
export default class EntityManager {
  readonly entitiesMap: Record<string, { entity?: EditableEntity | Promise<EditableEntity>; count: number }> = {};

  private getEntityKey(entityType: EntityTypes, entityId: EntityId) {
    return `${entityType}-${entityId}`;
  }

  reduce(entityType: EntityTypes, entityId: EntityId) {
    const key = this.getEntityKey(entityType, entityId);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = this.entitiesMap[key]!;

    record.count -= 1;

    if (record.count === 0) {
      delete this.entitiesMap[key];
    }
  }

  async get(entityType: EntityTypes, entityId: EntityId, fetch: () => Promise<EditableEntity>) {
    const key = this.getEntityKey(entityType, entityId);

    if (!this.entitiesMap[key]) {
      this.entitiesMap[key] = { count: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = this.entitiesMap[key]!;

    record.count += 1;

    if (record.entity) {
      return record.entity instanceof Promise ? await record.entity : record.entity;
    } else {
      return (record.entity = new Promise((resolve) => {
        fetch().then((entity) => {
          const result = observable(entity);

          record.entity = result;
          resolve(result);
        });
      }));
    }
  }
}
