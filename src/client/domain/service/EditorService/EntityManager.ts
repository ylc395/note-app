import { observable } from 'mobx';

import type { EntityId, EntityTypes } from 'interface/Entity';
import type { Entity as NoteEditorEntity } from 'model/note/Editor';

export type EditableEntity = NoteEditorEntity;

export type EntityLocator = {
  entityType: EntityTypes;
  entityId: EntityId;
};

export default class EntityManager {
  readonly entitiesMap: Record<string, { entity?: EditableEntity | Promise<EditableEntity>; count: number }> = {};

  private getEntityKey({ entityType, entityId }: EntityLocator) {
    return `${entityType}-${entityId}`;
  }

  reduceReference(locator: EntityLocator) {
    const key = this.getEntityKey(locator);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const record = this.entitiesMap[key]!;

    record.count -= 1;

    if (record.count === 0) {
      delete this.entitiesMap[key];
    }
  }

  async get(locator: EntityLocator, fetch: () => Promise<EditableEntity>) {
    const key = this.getEntityKey(locator);

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
