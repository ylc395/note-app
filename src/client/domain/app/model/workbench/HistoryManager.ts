import { action, makeObservable, observable, computed } from 'mobx';
import { last } from 'lodash-es';
import assert from 'assert';

import Editor from '../abstract/Editor';
import { EditableEntityLocator } from '../abstract/EditableEntity';
import type Workbench from './Workbench';
import { type default as Tile, SwitchReasons } from './Tile';

interface Record extends EditableEntityLocator {
  tileId: Tile['id'];
  editorId: Editor['id'];
}

export default class HistoryManager {
  constructor(private readonly workbench: Workbench) {
    makeObservable(this);
  }

  @observable.ref
  public currentEditor?: Editor;

  @observable.shallow
  private readonly backwards: Record[] = [];

  @observable.shallow
  private forwards: Record[] = [];

  @computed
  public get canForward() {
    return this.forwards.length > 0;
  }

  @computed
  public get canBackward() {
    return this.backwards.length > 0;
  }

  @action.bound
  public update(editor: Editor, reason?: SwitchReasons) {
    if (editor === this.currentEditor) {
      return;
    }

    if (this.currentEditor && last(this.backwards)?.editorId !== this.currentEditor.id) {
      const stack = reason === SwitchReasons.HistoryBack ? this.forwards : this.backwards;

      assert(this.currentEditor.tile);
      stack.push({
        ...this.currentEditor.entityLocator,
        tileId: this.currentEditor.tile.id,
        editorId: this.currentEditor.id,
      });
      console.log(`backwards added: ${JSON.stringify(last(this.backwards))}`);
    }

    if (reason !== SwitchReasons.HistoryBack && reason !== SwitchReasons.HistoryForward) {
      this.forwards = [];
    }

    this.currentEditor = editor;
  }

  @action.bound
  public go(direction: 'forward' | 'backward') {
    const recordToOpen = (direction === 'backward' ? this.backwards : this.forwards).pop();
    assert(recordToOpen);

    this.workbench.openEntity(recordToOpen, {
      dest: this.workbench.getTileById(recordToOpen.tileId),
      reason: direction === 'backward' ? SwitchReasons.HistoryBack : SwitchReasons.HistoryForward,
    });
  }
}
