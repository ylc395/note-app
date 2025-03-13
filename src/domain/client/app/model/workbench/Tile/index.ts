import { action, observable } from 'mobx';
import { uniqueId } from 'lodash-es';
import assert from 'assert';

import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import EventBus from '#domain/client/shared/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import type { EntityLocator } from '#domain/client/shared/model/entity';

import EditorFactory from '../EditorFactory';
import { type Events, EventNames } from './events';
import type { Direction } from '../HistoryStack';

export default class Tile {
  public readonly id = uniqueId('tile-');

  private readonly editorFactory = container.resolve(EditorFactory);

  public readonly events = new EventBus<Events>(this.id);

  @observable.ref public accessor currentEditor: Editor | undefined;

  @observable.shallow public accessor editors: Editor[] = [];

  public findEditor(locator: EntityLocator | Editor) {
    const existedEditor = this.editors.find((e) =>
      locator instanceof Editor ? locator === e : locator.entityId === e.entityId,
    );

    return existedEditor;
  }

  // 将本 Tile 的当前 editor 切换为指定的 editor。fromHistory 表示本次的切换动作是否是浏览历史栈弹出导致的
  // 切换有可能失败（当指定的 editor 不存在时）
  @action.bound
  public switchToEditor(editor: Editor | EntityLocator, params?: { fromHistory?: Direction }) {
    const target = this.findEditor(editor);
    assert(target || !(editor instanceof Editor), 'can not switch to an editor which not belong to this tile');

    if (!target) {
      return false;
    }

    if (target === this.currentEditor) {
      return true;
    }

    this.currentEditor = target;
    this.events.emit(EventNames.EditorSwitched, { editor: target, fromHistory: params?.fromHistory });

    return true;
  }

  // 将一个 Editor 从该 Tile 中移除
  @action.bound
  private removeEditor(editor: Editor) {
    const existedTabIndex = this.editors.indexOf(editor);
    assert(existedTabIndex >= 0, 'editor to remove is not in this tile');

    this.editors.splice(existedTabIndex, 1);
    editor.events.off(Editor.eventNames.Destroy, this.removeEditor);

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
  public createEditor(entity: EntityLocator, dest?: Editor) {
    assert(
      this.editors.findIndex((editor) => editor.entityId === entity.entityId) < 0,
      'can not create duplicated editor',
    );

    const newEditor = this.editorFactory.create(this, entity);

    newEditor.events.on(Editor.eventNames.Destroy, this.removeEditor);
    this.addEditor(newEditor, dest);

    return newEditor;
  }

  public addEditor(editor: Editor, dest?: Editor) {
    assert(this.editors.indexOf(editor) === -1, 'can not add twice');

    // 刚刚创建出来的 editor，其 tile 还没将其纳入其中
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

    this.events.emit(EventNames.Destroyed).then(() => {
      this.events.clearListeners();
    });
  }

  public static readonly eventNames = EventNames;
}
