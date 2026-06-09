import assert from 'assert';

import { EntityTypes } from '#domain/shared/model/entity';
import type Tile from './Tile';
import Editor from './BaseEditor';
import noteEditorFactory from './noteEditor/factory';
import type { EditorDTO, Factory } from './BaseEditor/types';
import type NoteBaseEditor from './noteEditor/BaseEditor';

export default class EditorFactory {
  private readonly editorsMap = new Map<Editor['id'], Editor>();

  public create(tile: Tile, config: EditorDTO) {
    const editor = EditorFactory.factoryMap[config.entityType](config, tile);

    this.editorsMap.set(editor.id, editor);
    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    this.editorsMap.delete(editor.id);
  }

  public get(id: Editor['id']) {
    return this.editorsMap.get(id);
  }

  public static assertIsEditor(value: unknown): asserts value is NoteBaseEditor {
    assert(value instanceof Editor);
  }

  private static readonly factoryMap: Readonly<Record<EntityTypes, Factory>> = {
    [EntityTypes.Note]: noteEditorFactory,
    [EntityTypes.Memo]: assert.fail,
    [EntityTypes.Annotation]: assert.fail,
  };
}
