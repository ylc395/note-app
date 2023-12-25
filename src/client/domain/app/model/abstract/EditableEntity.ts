import { uniqueId, pull } from 'lodash-es';
import { container } from 'tsyringe';
import { action, makeObservable, observable } from 'mobx';
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
  EntityUpdated = 'editableEntity.entityUpdated',
  EntityDestroyed = 'editableEntity.destroyed',
}

type Events = {
  [EventNames.EntityUpdated]: [];
  [EventNames.EntityDestroyed]: [];
};

export default abstract class EditableEntity<T = unknown, E extends Events = Events> extends Emitter<E> {
  protected readonly remote = container.resolve(remoteToken);
  readonly id = uniqueId('editableEntity-');
  abstract readonly entityType: EditableEntityTypes;
  protected readonly editors: Editor[] = [];

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

    this.editors.push(editor);
    editor.once(EditorEvents.Destroyed, () => this.handleEditorDestroy(editor));

    return editor;
  }

  private handleEditorDestroy(editor: Editor) {
    pull(this.editors, editor);

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  public destroy() {
    this.emit(EventNames.EntityDestroyed);
  }
}
