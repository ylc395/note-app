import { uniqueId } from 'lodash-es';
import { container } from 'tsyringe';
import { makeObservable, observable } from 'mobx';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { EntityId, EntityLocator, EntityTypes } from '../entity';
import type { Tile } from '../workbench';
import type Editor from './Editor';

export interface EditableEntityLocator extends EntityLocator {
  entityType: EntityTypes.Note | EntityTypes.Material;
}

export default abstract class EditableEntity<T = unknown> {
  constructor(public readonly entityId: EntityId) {
    makeObservable(this);
    this.load();
  }

  protected readonly remote = container.resolve(rpcToken);
  public readonly id = uniqueId('editableEntity-');
  public abstract readonly entityType: EditableEntityLocator['entityType'];

  @observable entity?: T;

  public abstract load(): Promise<void>; // todo: load must return a cancel function.
  public abstract destroy(): void;
  public abstract createEditor(tile: Tile): Editor;

  public toEntityLocator(): EditableEntityLocator {
    return { entityType: this.entityType, entityId: this.entityId };
  }

  static isEditable(locator: EntityLocator): locator is EditableEntityLocator {
    if (![EntityTypes.Note, EntityTypes.Material].includes(locator.entityType)) {
      return false;
    }

    if (locator.entityType === EntityTypes.Material && !locator.mimeType) {
      return false;
    }

    return true;
  }
}
