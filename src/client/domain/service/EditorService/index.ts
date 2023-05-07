import { container, singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';

import { EntityTypes, type EntityLocator } from 'interface/entity';
import type NoteEditor from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/Editor';
import Tile from 'model/workbench/Tile';
import TileManager, { type TileSplitDirections } from 'model/workbench/TileManger';
import NoteService, { NoteEvents } from 'service/NoteService';

import noteEditorFactory from './noteEditorFactory';

@singleton()
export default class EditorService {
  readonly tileManager = new TileManager();
  private editors: { [key in EntityTypes]?: Set<EntityEditor> } = {
    [EntityTypes.Note]: new Set<NoteEditor>(),
  };

  constructor() {
    makeObservable(this);
    this.init();
  }

  private init() {
    const noteService = container.resolve(NoteService);

    noteService.on(NoteEvents.Updated, (notes) => {
      for (const note of notes) {
        for (const editor of this.getEditorsByEntity<NoteEditor>({ type: EntityTypes.Note, id: note.id })) {
          editor.updateNote(note, false);
        }
      }
    });
  }

  private createEditor(tile: Tile, { id, type }: EntityLocator) {
    const editorSet = this.editors[type];
    let editor: EntityEditor;

    if (!editorSet) {
      throw new Error('invalid type');
    }

    switch (type) {
      case EntityTypes.Note:
        editor = noteEditorFactory(this, tile, id);
        break;
      default:
        throw new Error('invalid type');
    }

    editorSet.add(editor);
    editor.once(EditorEvents.Destroyed, () => editorSet.delete(editor as NoteEditor));

    return editor;
  }

  getEditorsByEntity<T extends EntityEditor>({ id, type }: EntityLocator, excludeId?: EntityEditor['id']) {
    const editorSet = this.editors[type];

    if (!editorSet) {
      throw new Error('unsupported type');
    }

    return Array.from(editorSet).filter((e) => e.entityId === id && (excludeId ? excludeId !== e.id : true)) as T[];
  }

  @action.bound
  openEntity(entity: EntityLocator, newTileOptions?: { direction: TileSplitDirections; from: Tile }) {
    if (newTileOptions) {
      const newTile = this.tileManager.splitTile(newTileOptions.from.id, newTileOptions.direction);
      const editor = this.createEditor(newTile, entity);

      newTile.addEditor(editor);
    } else {
      const targetTile = this.tileManager.getTileAsTarget();

      if (
        !targetTile.switchToEditor(({ entityId, entityType }) => entityType === entity.type && entityId === entity.id)
      ) {
        const editor = this.createEditor(targetTile, entity);
        targetTile.addEditor(editor);
      }
    }
  }

  @action.bound
  moveEditor(srcEditor: EntityEditor, dest: EntityEditor | Tile | { from: Tile; splitDirection: TileSplitDirections }) {
    if (dest instanceof Tile) {
      if (srcEditor.tile === dest) {
        srcEditor.tile.moveEditor(srcEditor, 'end');
      } else {
        srcEditor.tile.removeEditor(srcEditor.id, false);
        dest.addEditor(srcEditor);
      }
      return;
    } else if (dest instanceof EntityEditor) {
      if (srcEditor.tile === dest.tile) {
        dest.tile.moveEditor(srcEditor, dest);
      } else {
        srcEditor.tile.removeEditor(srcEditor.id, false);
        dest.tile.addEditor(srcEditor, dest);
      }
    } else {
      const { from, splitDirection } = dest;
      const newTile = this.tileManager.splitTile(from.id, splitDirection);
      from.removeEditor(srcEditor.id, false);
      newTile.addEditor(srcEditor);
    }
  }
}
