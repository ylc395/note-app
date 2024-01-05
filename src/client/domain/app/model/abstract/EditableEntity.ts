import { uniqueId } from 'lodash-es';
import { container } from 'tsyringe';
import { makeObservable, observable } from 'mobx';
import { Emitter } from 'strict-event-emitter';

import { token as remoteToken } from '@domain/common/infra/remote';
import { EntityId, EntityLocator, EntityTypes } from '../entity';
import type { Tile } from '../workbench';
import { type default as Editor, EventNames as EditorEvents } from './Editor';

export type EditableEntityTypes = EntityTypes.Note | EntityTypes.Material;

export interface EditableEntityLocator extends EntityLocator {
  entityType: EditableEntityTypes;
}

export const isEditableEntityLocator = (locator: EntityLocator): locator is EditableEntityLocator =>
  [EntityTypes.Note, EntityTypes.Material].includes(locator.entityType);

export enum EventNames {
  EntityDestroyed = 'editableEntity.destroyed',
}

type Events = {
  [EventNames.EntityDestroyed]: [];
};

export default abstract class EditableEntity<T = unknown> extends Emitter<Events> {
  protected readonly remote = container.resolve(remoteToken);
  public readonly id = uniqueId('editableEntity-');
  public abstract readonly entityType: EditableEntityTypes;
  private editorsCount = 0;

  @observable entity?: T;

  constructor(public readonly entityId: EntityId) {
    super();
    makeObservable(this);
    this.load();
  }

  public abstract load(): Promise<void>;

  public toEntityLocator(): EditableEntityLocator {
    return { entityType: this.entityType, entityId: this.entityId };
  }

  protected abstract getEditor(tile: Tile): Editor;

  public createEditor(tile: Tile) {
    const editor = this.getEditor(tile);

    this.editorsCount += 1;
    editor.once(EditorEvents.Destroyed, this.handleEditorDestroy);

    return editor;
  }

  private readonly handleEditorDestroy = () => {
    this.editorsCount -= 1;

    if (this.editorsCount === 0) {
      this.destroy();
    }
  };

  public destroy() {
    this.emit(EventNames.EntityDestroyed);
  }
}
