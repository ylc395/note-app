import { action, observable } from 'mobx';
import { uniqueId, isMatch } from 'lodash-es';
import assert from 'assert';

import Editor from '#domain/client/app/model/abstract/Editor';
import EventBus from '#domain/client/app/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import type { EntityLocator } from '#domain/client/shared/model/entity';

import EditorFactory from '../EditorFactory';
import { type Events, EventNames } from './events';
import type { Direction } from '../Workbench/HistoryStack';

export default class Tile {
  constructor() {
    const id = uniqueId('tile-');

    this.id = id;
    this.events = new EventBus<Events>(id);
  }

  public readonly events;

  public readonly id: string;
  private readonly editorFactory = container.resolve(EditorFactory);
  private readonly subscriptionMap: Record<Editor['id'], () => void> = {};

  @observable.ref public accessor currentEditor: Editor | undefined;

  @observable.shallow public accessor editors: Editor[] = [];

  public findEditor(locator: EntityLocator | Editor) {
    const existedEditor = this.editors.find((e) =>
      locator instanceof Editor ? locator === e : isMatch(locator, e.entityLocator),
    );

    return existedEditor;
  }

  @action.bound
  public switchToEditor(editor: Editor | EntityLocator, params?: { fromHistory?: Direction }) {
    const existedEditor = this.findEditor(editor);

    if (!existedEditor) {
      return false;
    }

    this.currentEditor = existedEditor;
    this.events.emit(EventNames.EditorSwitched, { to: existedEditor, fromHistory: params?.fromHistory });

    return true;
  }

  @action
  private removeEditor(editor: Editor) {
    const existedTabIndex = this.editors.indexOf(editor);
    assert(existedTabIndex >= 0, 'editor not in this tile');

    this.editors.splice(existedTabIndex, 1);

    this.subscriptionMap[editor.id]!();
    delete this.subscriptionMap[editor.id];

    if (this.currentEditor === editor) {
      this.currentEditor = this.editors[existedTabIndex] || this.editors[existedTabIndex - 1];

      if (this.currentEditor) {
        this.switchToEditor(this.currentEditor);
      }
    }

    if (this.editors.length === 0) {
      this.destroy();
    }
  }

  @action
  public createEditor(entity: EntityLocator, options?: { dest?: Editor; replace?: boolean }) {
    if (options?.dest) {
      assert(options.dest.tile === this, 'tile of target editor is not this tile');
    }

    const newEditor = this.editorFactory.create(this, entity);

    if (options?.dest) {
      const destIndex = this.editors.findIndex((editor) => editor === options.dest);
      assert(destIndex >= 0, 'dest editor is not in this tile');

      const [replaced] = this.editors.splice(destIndex, options.replace ? 1 : 0, newEditor);

      if (replaced) {
        replaced.destroy();
      }
    } else {
      this.editors.push(newEditor);
    }

    this.subscriptionMap[newEditor.id] = newEditor.events.on(
      Editor.events.Destroy,
      this.removeEditor.bind(this, newEditor),
    );

    return newEditor;
  }

  @action
  public moveEditor(editor: Editor, to?: Editor) {
    if (to) {
      const destIndex = this.editors.indexOf(to);
      assert(destIndex >= 0, 'target editor is not in this tile');

      this.editors.splice(destIndex, 0, editor);
    } else {
      assert(editor.tile !== this, 'target editor should be provided when moving editor existing in this tile');
      this.editors.push(editor);
    }

    if (editor.tile !== this) {
      editor.tile.removeEditor(editor);
      editor.tile = this;
    }

    // 删掉属于同一个 entity 的原有 editor
    const duplicatedIndex = this.editors.findIndex(
      (e) => isMatch(e.entityLocator, editor.entityLocator) && e !== editor,
    );

    if (duplicatedIndex >= 0) {
      const [duplicated] = this.editors.splice(duplicatedIndex, 1);
      duplicated!.destroy();
    }
  }

  @action
  public destroy() {
    this.currentEditor = undefined;

    for (const editor of this.editors) {
      editor.destroy();
    }

    this.events.emit(EventNames.Destroyed);
    this.events.clearListeners();
  }

  public static readonly events = EventNames;
}
