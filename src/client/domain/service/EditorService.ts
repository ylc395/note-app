import EventEmitter from 'eventemitter2';
import { singleton } from 'tsyringe';

import { EntityId, EntityTypes } from 'interface/Entity';

import NoteEditor from 'model/editor/NoteEditor';
import type Window from 'model/windowManager/Window';
import EntityEditor, { Events as EditorEvents } from 'model/editor/EntityEditor';

@singleton()
export default class EditorService extends EventEmitter {
  private readonly editors = new Set<EntityEditor>();

  createEditor(window: Window, entityType: EntityTypes, entityId: EntityId) {
    const editorConstructorsMap = {
      [EntityTypes.Note]: NoteEditor,
    };

    const editor = new editorConstructorsMap[entityType](window, entityId);

    this.editors.add(editor);
    editor.onAny(this.emit.bind(this));
    editor.on(EditorEvents.Destroyed, () => this.editors.delete(editor));

    return editor;
  }
}
