import { uniqueId, pull } from 'lodash-es';
import { container } from 'tsyringe';
import { action, makeObservable, observable } from 'mobx';
import { Emitter } from 'strict-event-emitter';

import type { EntityId, EntityLocator, EntityTypes } from '@domain/model/entity';
import type { Tile } from '@domain/model/workbench';
import { token as remoteToken } from '@domain/infra/remote';
import { type default as Editor, EventNames as EditorEvents } from './Editor';

export type EditableEntityTypes = EntityTypes.Note | EntityTypes.Material;

export interface EditableEntityLocator extends EntityLocator {
  entityType: EditableEntityTypes;
}

export enum EventNames {
  EntityUpdated = 'editableEntity.entityUpdated',
}

type Events = {
  [EventNames.EntityUpdated]: [];
};

export default abstract class EditableEntity<T = unknown, E extends Events = Events> extends Emitter<E> {
  protected readonly remote = container.resolve(remoteToken);
  readonly id = uniqueId('editableEntity-');
  abstract readonly entityType: EditableEntityTypes;
  protected readonly editors: Editor[] = [];

  abstract init(): void;

  @observable entity?: T;

  constructor(public readonly entityId: EntityId) {
    super();
    makeObservable(this);
    this.init();
  }

  @action
  protected load(entity: T) {
    this.entity = entity;
  }

  toEntityLocator(): EditableEntityLocator {
    return { entityType: this.entityType, entityId: this.entityId };
  }

  protected abstract getEditor(tile: Tile): Editor;

  createEditor(tile: Tile) {
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

  abstract destroy(): void;
}
