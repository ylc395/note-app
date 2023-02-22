import EventEmitter from 'eventemitter2';
import { singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';

import { EntityTypes, type EntityId } from 'interface/Entity';

import NoteEditor from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/editor';
import type Tile from 'model/workbench/Tile';
import TileManager from 'model/workbench/TileManger';

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
    const targetWindow = this.tileManager.getTargetTile();

    if (!type) {
      const existedTab = targetWindow.tabs.find(
        (editor) => editor.entityType === entity.entityType && editor.entityId === entity.entityId,
      );

      if (existedTab) {
        targetWindow.currentTab = existedTab;
      } else {
        const editor = this.createEditor(targetWindow, entity);
        targetWindow.createTab(editor);
      }

      return;
    }

    const editor = this.createEditor(targetWindow, entity);

    if (type === 'newWindow') {
      if (targetWindow.isRoot && targetWindow.tabs.length === 0) {
        targetWindow.createTab(editor);
        return;
      }

      const newWindow = this.tileManager.splitTile(targetWindow.id);
      newWindow.createTab(editor);
    } else if (type === 'newTab') {
      targetWindow.createTab(editor);
    }
  }

  @action.bound
  duplicateOnNewTile() {
    const { focusedTile } = this.tileManager;

    if (!focusedTile) {
      throw new Error('no focusedTile');
    }

    const currentTab = focusedTile.currentTab;

    if (!currentTab) {
      throw new Error('no tab');
    }

    const newTile = this.tileManager.splitTile(focusedTile.id);
    const editor = this.createEditor(newTile, { entityId: currentTab.entityId, entityType: currentTab.entityType });

    newTile.createTab(editor);
  }
}
