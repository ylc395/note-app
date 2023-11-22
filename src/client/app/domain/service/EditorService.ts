import { container, singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';
import isMatch from 'lodash/isMatch';

import type { EditableEntityLocator } from 'model/entity';
import Tile from 'model/workbench/Tile';
import { type TileSplitDirections, Workbench } from 'model/workbench';
import Editor from 'model/abstract/Editor';

type Dest = Tile | Editor | { from: Tile; splitDirection: TileSplitDirections };

@singleton()
export default class EditorService {
  private readonly workbench = container.resolve(Workbench);

  constructor() {
    makeObservable(this);
  }

  @action.bound
  openEntity(entity: EditableEntityLocator, dest?: Dest) {
    let targetTile: Tile;
    let editor: Editor;

    if (dest instanceof Tile || dest instanceof Editor || !dest) {
      targetTile = dest ? (dest instanceof Tile ? dest : dest.tile) : this.workbench.getFocusedTile();

      if (targetTile.switchToEditor((editor) => isMatch(entity, editor.toEntityLocator()), true)) {
        return;
      }

      editor = targetTile.createEditor(entity, dest instanceof Editor ? dest : undefined);
    } else {
      targetTile = this.workbench.splitTile(dest.from.id, dest.splitDirection);
      editor = targetTile.createEditor(entity);
    }

    targetTile.switchToEditor(editor);
  }

  @action.bound
  moveEditor(srcEditor: Editor, dest: Dest) {
    if (dest instanceof Tile) {
      dest.moveEditor(srcEditor);
    } else if (dest instanceof Editor) {
      dest.tile.moveEditor(srcEditor, dest);
    } else {
      const { from, splitDirection } = dest;
      const newTile = this.workbench.splitTile(from.id, splitDirection);
      newTile.moveEditor(srcEditor);
    }
  }
}
