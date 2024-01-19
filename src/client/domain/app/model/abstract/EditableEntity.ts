import { container } from 'tsyringe';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { EntityId, EntityLocator, EntityTypes, Path } from '../entity';
import type { Tile } from '../workbench';
import type Editor from './Editor';

export interface EditableEntityLocator extends EntityLocator {
  entityType: EntityTypes.Note | EntityTypes.Material;
}

export default abstract class EditableEntity {
  constructor(private readonly entityId: EntityId) {
    this.load();
  }

  protected readonly remote = container.resolve(rpcToken);
  protected abstract readonly entityType: EditableEntityLocator['entityType'];

  protected abstract load(): Promise<void>; // todo: load must return a cancel function.
  public abstract destroy(): void;
  public abstract createEditor(tile: Tile): Editor;

  public abstract info?: {
    icon: string | null;
    path: Path;
    title: string;
  };

  public get entityLocator() {
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
