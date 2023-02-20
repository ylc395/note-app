import EventEmitter from 'eventemitter2';
import { singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';

import { EntityTypes, type EntityId } from 'interface/Entity';

import NoteEditor from 'model/editor/NoteEditor';
import { Events as EditorEvents } from 'model/editor/EntityEditor';
import type Window from 'model/windowManager/Window';
import WindowManager from 'model/windowManager/Manger';

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
  readonly windowManager = new WindowManager();
  private readonly editors = new Set<NoteEditor>();

  private createEditor(window: Window, { entityId, entityType: type }: OpenableEntity) {
    const editor = new editorConstructorsMap[type](window, entityId);

    this.editors.add(editor);
    editor.onAny(this.emit.bind(this));
    editor.on(EditorEvents.Destroyed, () => this.editors.delete(editor));

    return editor;
  }

  @action.bound
  openEntity(entity: OpenableEntity, type?: 'newTab' | 'newWindow') {
    const targetWindow = this.windowManager.getTargetWindow();

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

      const newWindow = this.windowManager.splitWindow(targetWindow.id);
      newWindow.createTab(editor);
    } else if (type === 'newTab') {
      targetWindow.createTab(editor);
    }
  }

  @action.bound
  duplicateOnNewWindow() {
    const { focusedWindow } = this.windowManager;

    if (!focusedWindow) {
      throw new Error('no focusedWindow');
    }

    const currentTab = focusedWindow.currentTab;

    if (!currentTab) {
      throw new Error('no tab');
    }

    const newWindow = this.windowManager.splitWindow(focusedWindow.id);
    const editor = this.createEditor(newWindow, { entityId: currentTab.entityId, entityType: currentTab.entityType });

    newWindow.createTab(editor);
  }
}
