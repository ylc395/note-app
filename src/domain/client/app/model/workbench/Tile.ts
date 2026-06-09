import { action, observable } from 'mobx';
import { uniqueId, without } from 'lodash-es';
import assert from 'assert';

import Editor from './BaseEditor';
import container from '#utils/singletonContainer';

import EditorFactory from './EditorFactory';
import type { EditorDTO } from './BaseEditor/types';
import type { EntityId } from '#domain/shared/model/entity';
import type Workbench from './index';

export default class Tile {
  constructor(
    public readonly workbench: Workbench,
    private readonly options: {
      onDestroy: (tile: Tile) => void;
      onEditorFocus: (editor: Editor) => void;
    },
  ) {}

  public readonly id = uniqueId('tile-');

  private isRestoring = false;

  private readonly editorFactory = container.resolve(EditorFactory);

  @observable.ref public accessor currentEditor: Editor | undefined;

  @observable.shallow public accessor editors: Editor[] = [];

  public findEditor(locator: EntityId | Editor) {
    const existedEditor = this.editors.find((e) =>
      locator instanceof Editor ? locator === e : locator === e.entityId,
    );

    return existedEditor;
  }

  // 将本 Tile 的当前 editor 切换为指定的 editor
  @action.bound
  public switchToEditor(editor: Editor | EntityId) {
    const target = this.findEditor(editor);
    assert(target, 'can not switch to an editor which not belong to this tile');

    this.currentEditor = target;

    if (!this.isRestoring) {
      target.focus();
    }
  }

  // 将一个 Editor 从该 Tile 中移除
  @action.bound
  private removeEditor(editor: Editor) {
    const existedTabIndex = this.editors.indexOf(editor);
    assert(existedTabIndex >= 0, 'editor to remove is not in this tile');

    this.editors.splice(existedTabIndex, 1);
    editor.events.off(Editor.eventNames.Destroy, this.removeEditor);
    editor.events.off(Editor.eventNames.Focus, this.options.onEditorFocus);

    if (this.currentEditor === editor) {
      const newCurrentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];

      if (newCurrentEditor) {
        this.switchToEditor(newCurrentEditor);
      }
    }

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  // 在该 Tile 下创建一个 Editor。可以指定其位置
  // 不能创建 noteId-mimeType 均相同的两个 editor（相同 noteId 不同 mimeType 的 editor，则可能在预览过程中短暂共存）
  @action
  public createAndAddEditor(entity: EditorDTO, dest?: Editor | number) {
    const newEditor = this.editorFactory.create(this, entity);

    assert(
      !this.editors.find((editor) => editor.entityId === entity.entityId && editor.mimeType === entity.mimeType),
      'can not create duplicated editor',
    );
    this.addEditor(newEditor, dest);

    return newEditor;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public replace<T extends EditorDTO>(editor: Editor<any>, newEditorDTO: T) {
    const index = editor.index;
    assert(editor.tile === this);
    editor.destroy();

    const newEditor = this.createAndAddEditor(newEditorDTO, index);
    this.switchToEditor(newEditor);
  }

  @action
  public addEditor(editor: Editor, dest?: Editor | number) {
    if (editor.tile.editors.includes(editor)) {
      editor.tile.removeEditor(editor);
    }

    if (dest) {
      const index = typeof dest === 'number' ? dest : this.editors.indexOf(dest);
      assert(index >= 0, 'dest editor is invalid');
      this.editors.splice(index, 0, editor);
    } else {
      this.editors.push(editor);
    }

    editor.tile = this;
    editor.events.on(Editor.eventNames.Destroy, this.removeEditor);
    editor.events.on(Editor.eventNames.Focus, this.options.onEditorFocus);
  }

  @action
  public destroy() {
    this.currentEditor = undefined;

    for (const editor of this.editors) {
      editor.destroy();
    }

    this.options.onDestroy(this);
  }

  @action
  public closeEditors(target: Editor, type: 'left' | 'right' | 'others') {
    let editorsToClose;
    const index = this.editors.indexOf(target);
    assert(index > -1);

    switch (type) {
      case 'others':
        editorsToClose = without(this.editors, target);
        break;
      case 'left':
        editorsToClose = this.editors.slice(0, index);
        break;
      case 'right':
        editorsToClose = this.editors.slice(index + 1);
        break;
      default:
        throw new Error('invalid type');
    }

    for (const editor of editorsToClose) {
      editor.destroy();
    }
  }

  public toObject() {
    assert(this.currentEditor);

    return {
      editors: this.editors.map((e) => e.toObject()),
      current: this.currentEditor.entityId,
    };
  }

  public restore({ editors, current }: { editors: Array<EditorDTO>; current: EntityId }) {
    this.isRestoring = true;
    for (const editor of editors) {
      this.createAndAddEditor(editor);
    }

    this.switchToEditor(current);
    this.isRestoring = false;
  }
}
