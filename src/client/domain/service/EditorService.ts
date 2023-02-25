import EventEmitter from 'eventemitter2';
import { singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';

import { EntityTypes, type EntityId } from 'interface/Entity';

import NoteEditor from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/editor';
import type Tile from 'model/workbench/Tile';
import TileManager, { TileDirections } from 'model/workbench/TileManger';

type OpenableEntity = {
  entityType: EntityTypes;
  entityId: EntityId;
};

const editorConstructorsMap = {
  [EntityTypes.Note]: NoteEditor,
};

@singleton()
export default class EditorService extends EventEmitter {
  constructor() {
    super();
    makeObservable(this);
  }
  readonly tileManager = new TileManager();
  private readonly editors = new Set<EntityEditor>();

  private createEditor(tile: Tile, { entityId, entityType }: OpenableEntity) {
    const editor = new editorConstructorsMap[entityType](tile, entityId);

    this.editors.add(editor);
    editor.onAny(this.emit.bind(this));
    editor.on(EditorEvents.Destroyed, () => this.editors.delete(editor));

    return editor;
  }

  @action.bound
  openEntity(entity: OpenableEntity, type?: 'newTab' | 'newWindow') {
    const targetTile = this.tileManager.getTileAsTarget();

    if (!type) {
      const existedTab = targetTile.tabs.find(
        (editor) => editor.entityType === entity.entityType && editor.entityId === entity.entityId,
      );

      if (existedTab) {
        targetTile.currentTab = existedTab;
      } else {
        const editor = this.createEditor(targetTile, entity);
        targetTile.createTab(editor);
      }

      return;
    }

    const editor = this.createEditor(targetTile, entity);

    if (type === 'newWindow') {
      if (targetTile.isRoot && targetTile.tabs.length === 0) {
        targetTile.createTab(editor);
        return;
      }

      const newTile = this.tileManager.splitTile(targetTile.id, TileDirections.Horizontal);
      newTile.createTab(editor);
    } else if (type === 'newTab') {
      targetTile.createTab(editor);
    }
  }

  @action.bound
  duplicateOnNewTile(tileId: Tile['id'], direction: TileDirections) {
    const fromTile = this.tileManager.get(tileId);

    if (!fromTile.currentTab) {
      throw new Error('no current tab');
    }

    const { entityId, entityType } = fromTile.currentTab;
    const newTile = this.tileManager.splitTile(tileId, direction);
    const editor = this.createEditor(newTile, { entityId, entityType });

    newTile.createTab(editor);
  }
}
