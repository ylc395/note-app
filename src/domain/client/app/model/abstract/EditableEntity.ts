import { container } from 'tsyringe';
import { observable, makeObservable } from 'mobx';

import { token as rpcToken } from '@domain/client/common/infra/rpc';
import { type EntityId, type EntityLocator, EntityTypes, type Path } from '../entity';
import type { Tile } from '../workbench';
import type Editor from './Editor';

export interface EditableEntityLocator extends EntityLocator {
  entityType: EntityTypes.Note | EntityTypes.Material;
}

interface EntityInfo {
  icon: string | null;
  title: string;
}

export default abstract class EditableEntity<T extends EntityInfo = EntityInfo> {
  constructor(protected readonly entityId: EntityId) {
    makeObservable(this);
    this.load();
  }

  protected readonly remote = container.resolve(rpcToken);
  protected abstract readonly entityType: EditableEntityLocator['entityType'];
  public abstract entity?: T;

  @observable
  public path?: Path;

  protected abstract load(): Promise<void>; // todo: load must return a cancel function.
  public abstract destroy(): void;
  public abstract createEditor(tile: Tile): Editor;

  public get entityLocator() {
    return { entityType: this.entityType, entityId: this.entityId };
  }

  public static isEditable(locator: EntityLocator): locator is EditableEntityLocator {
    if (![EntityTypes.Note, EntityTypes.Material].includes(locator.entityType)) {
      return false;
    }

    if (locator.entityType === EntityTypes.Material && !locator.mimeType) {
      return false;
    }

    return true;
  }
}
