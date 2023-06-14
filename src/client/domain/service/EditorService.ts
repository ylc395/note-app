import { singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';

import type { EntityLocator } from 'interface/entity';
import Tile from 'model/workbench/Tile';
import TileManager, { type TileSplitDirections } from 'model/workbench/TileManger';
import EditorManager from 'model/workbench/EditorManager';
import EditorView from 'model/abstract/EditorView';

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
      const editorView = this.editorManager.createEditorView(newTile, entity);
      newTile.addEditorView(editorView);
    } else {
      const targetTile = this.tileManager.getTileAsTarget();
      const existingEditor = this.editorManager.getEditorByEntity(entity);

      if (existingEditor && targetTile.switchToEditorView(({ editor }) => editor === existingEditor)) {
        return;
      }

      const editorView = this.editorManager.createEditorView(targetTile, entity);
      targetTile.addEditorView(editorView);
    }
  }

  @action.bound
  moveEditorView(srcEditor: EditorView, dest: EditorView | Tile | { from: Tile; splitDirection: TileSplitDirections }) {
    if (dest instanceof Tile) {
      if (srcEditor.tile === dest) {
        srcEditor.tile.moveEditorView(srcEditor, 'end');
      } else {
        srcEditor.tile.removeEditorView(srcEditor.id, false);
        dest.addEditorView(srcEditor);
      }
      return;
    } else if (dest instanceof EditorView) {
      if (srcEditor.tile === dest.tile) {
        dest.tile.moveEditorView(srcEditor, dest);
      } else {
        srcEditor.tile.removeEditorView(srcEditor.id, false);
        dest.tile.addEditorView(srcEditor, dest);
      }
    } else {
      const { from, splitDirection } = dest;
      const newTile = this.tileManager.splitTile(from.id, splitDirection);
      from.removeEditorView(srcEditor.id, false);
      newTile.addEditorView(srcEditor);
    }
  }
}
