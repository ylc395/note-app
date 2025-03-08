import { action, computed, observable } from 'mobx';
import { uniqueId } from 'lodash-es';
import assert from 'assert';

import Editor from '#domain/client/app/model/note/editor/BaseEditor';
import EventBus from '#domain/client/shared/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import type { EntityLocator } from '#domain/client/shared/model/entity';

import EditorFactory from '../EditorFactory';
import { type Events, EventNames } from './events';
import type { Direction } from '../HistoryStack';
import { normalizeTitle } from '#domain/shared/model/note';

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
  public createEditor(entity: EntityLocator, to?: { dest: Editor; replace?: boolean }) {
    assert(
      this.editors.findIndex((editor) => editor.entityId === entity.entityId) < 0,
      'can not create duplicated editor',
    );

    if (to) {
      assert(to.dest.tile === this, 'tile of target editor is not this tile');
    }

    const newEditor = this.editorFactory.create(this, entity);
    newEditor.events.on(Editor.eventNames.Destroy, this.removeEditor);

    this.addEditor(newEditor, to);

    return newEditor;
  }

  // 将该 tile 内的一个 editor 移动到该 tile 内的另一个位置
  public moveEditor(editor: Editor, { dest, replace }: { dest: Editor; replace?: boolean }) {
    assert(this.findEditor(editor) && this.findEditor(dest), 'can not move');

    if (editor === dest) {
      return;
    }

    const index = this.editors.indexOf(editor);
    this.editors.splice(index, 1);

    const targetIndex = this.editors.indexOf(dest);
    this.editors.splice(targetIndex, 0, editor);

    if (replace) {
      dest.destroy();
    }
  }

  // 将一个 Editor 纳入该 Tile 中。将解除它和原 Tile 的关系
  // 若已存在一个相同内容的 editor，则那个 editor 将被 destroy
  @action
  public addEditor(editor: Editor, to?: { dest: Editor; replace?: boolean }) {
    assert(!this.findEditor(editor), 'can not add twice');

    if (to) {
      const destIndex = this.editors.indexOf(to.dest);
      assert(destIndex >= 0, 'target editor is not in this tile');

      this.editors.splice(destIndex, 0, editor);

      if (to.replace) {
        to.dest.destroy();
      }
    } else {
      this.editors.push(editor);
    }

    // 注意：新创建的 editor，其 tile === this 但又不在 this.editors 中。因此这里的 if 判断是有必要的
    if (editor.tile !== this) {
      editor.tile.removeEditor(editor);
      editor.tile = this;
    }

    // 删掉属于同一个 entity 的原有 editor。因此一个 Tile 内不会有两个内容一致的 Editor
    const duplicated = this.editors.find((e) => e.entityId === editor.entityId && e !== editor);

    if (duplicated) {
      duplicated.destroy();
    }
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

  @computed
  public get editorsWithDuplicatedTitle() {
    const loadedEditors = this.editors.filter(({ value }) => value.result.data);
    const titleGroup = Object.groupBy(loadedEditors, ({ value }) => normalizeTitle(value.result.data!));

    return new Set(
      Object.values(titleGroup)
        .filter((editors) => editors!.length > 1)
        .flat(),
    );
  }

  public static readonly eventNames = EventNames;
}
