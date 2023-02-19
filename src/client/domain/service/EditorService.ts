import EventEmitter from 'eventemitter2';
import { singleton } from 'tsyringe';

import { EntityId, EntityTypes } from 'interface/Entity';
import NoteEditor from 'model/editor/NoteEditor';
import type Window from 'model/windowManager/Window';

export enum Events {
  NoteUpdated = 'editor.note.updated',
}

@singleton()
export default class EditorService extends EventEmitter {
  private readonly editors: NoteEditor[] = [];
  createEditor(window: Window, entityType: EntityTypes, entityId: EntityId) {
    const editorsMap = {
      [EntityTypes.Note]: NoteEditor,
    };

    const editor = new editorsMap[entityType](window, entityId);

    editor.onAny(this.emit.bind(this));
    this.editors.push(editor);

    return editor;
  }
}
