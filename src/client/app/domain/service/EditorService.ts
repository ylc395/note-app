import { singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';

import type { EntityLocator } from 'model/entity';
import Tile from 'model/workbench/Tile';
import TileManager, { type TileSplitDirections } from 'model/workbench/TileManger';
import EditorManager from 'model/workbench/EditorManager';
import Editor from 'model/abstract/Editor';

@singleton()
export default class EditorService {
  readonly tileManager = new TileManager();
  private readonly editorManager = new EditorManager();

  constructor() {
    makeObservable(this);
  }

  @action.bound
  openEntity(entity: EntityLocator, newTileOptions?: { direction: TileSplitDirections; from: Tile }) {
    if (newTileOptions) {
      const newTile = this.tileManager.splitTile(newTileOptions.from.id, newTileOptions.direction);
      const editor = this.editorManager.createEditor(newTile, entity);
      newTile.addEditor(editor);
    } else {
      const targetTile = this.tileManager.getTileAsTarget();
      const existingEntity = this.editorManager.getEditableEntity(entity);

      if (existingEntity && targetTile.switchToEditor(({ editable: editor }) => editor === existingEntity)) {
        return;
      }

      const editor = this.editorManager.createEditor(targetTile, entity);
      targetTile.addEditor(editor);
    }
  }

  @action.bound
  moveEditor(srcEditor: Editor, dest: Editor | Tile | { from: Tile; splitDirection: TileSplitDirections }) {
    if (dest instanceof Tile) {
      if (srcEditor.tile === dest) {
        srcEditor.tile.moveEditor(srcEditor, 'end');
      } else {
        srcEditor.tile.removeEditor(srcEditor.id, false);
        dest.addEditor(srcEditor);
      }
      return;
    } else if (dest instanceof Editor) {
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
