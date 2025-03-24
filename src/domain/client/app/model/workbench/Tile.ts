import { action, observable } from 'mobx';
import { uniqueId } from 'lodash-es';
import assert from 'assert';

import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import { container } from '#domain/shared/infra/singletons';
import type { NoteVO } from '#domain/shared/model/note';

import EditorManager from './EditorManager';
import type { Direction } from '../base/HistoryStack';

export default class Tile {
  constructor(
    private readonly options: {
      onDestroy: (tile: Tile) => void;
      onEditorFocus: (e: { editor: Editor; fromHistory?: Direction }) => void;
    },
  ) {}

  public readonly id = uniqueId('tile-');

  private readonly editorManager = container.resolve(EditorManager);

  @observable.ref public accessor currentEditor: Editor | undefined;

  @observable.shallow public accessor editors: Editor[] = [];

  public findEditor(locator: NoteVO['id'] | Editor) {
    const existedEditor = this.editors.find((e) =>
      locator instanceof Editor ? locator === e : locator === e.entityId,
    );

    return existedEditor;
  }

  // 将本 Tile 的当前 editor 切换为指定的 editor。fromHistory 表示本次的切换动作是否是浏览历史栈弹出导致的
  @action.bound
  public switchToEditor(editor: Editor | NoteVO['id'], options?: { isFromHistory?: Direction }) {
    const target = this.findEditor(editor);
    assert(target, 'can not switch to an editor which not belong to this tile');

    this.currentEditor = target;
    target.focus({ isFromHistory: options?.isFromHistory });
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
  // 不能创建内容相同的 editor
  @action
  public createEditor(entity: Pick<NoteVO, 'id' | 'mimeType'>, dest?: Editor) {
    assert(this.editors.findIndex((editor) => editor.entityId === entity.id) < 0, 'can not create duplicated editor');

    const newEditor = this.editorManager.create(this, entity);

    newEditor.events.on(Editor.eventNames.Destroy, this.removeEditor);
    newEditor.events.on(Editor.eventNames.Focus, this.options.onEditorFocus);
    this.addEditor(newEditor, dest);

    return newEditor;
  }

  public addEditor(editor: Editor, dest?: Editor) {
    // 刚刚创建出来的 editor，其 tile 还没将其纳入其中。因此这个 if 判断是有意义的
    if (editor.tile.editors.includes(editor)) {
      editor.tile.removeEditor(editor);
    }

    if (dest) {
      const index = this.editors.indexOf(dest);
      assert(index >= 0, 'dest editor is invalid');
      this.editors.splice(index, 0, editor);
    } else {
      this.editors.push(editor);
    }

    editor.tile = this;
    editor.events.on(Editor.eventNames.Destroy, this.removeEditor);
  }

  @action
  public destroy() {
    this.currentEditor = undefined;

    for (const editor of this.editors) {
      editor.destroy();
    }

    this.options.onDestroy(this);
  }
}
