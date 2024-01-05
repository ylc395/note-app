import { action, makeObservable, observable, computed } from 'mobx';
import { last } from 'lodash-es';
import assert from 'assert';

import Editor from '../abstract/Editor';
import { EditableEntityLocator } from '../abstract/EditableEntity';
import type Workbench from './Workbench';
import type Tile from './Tile';

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
  public update(editor: Editor, resetReason?: boolean) {
    const reason = editor.visibilityReason;

    if (resetReason) {
      editor.visibilityReason = undefined;
    }

    if (editor === this.currentEditor) {
      return;
    }

    if (reason !== 'history') {
      const lastRecord = last(this.backwards);

      if (this.currentEditor && lastRecord?.editorId !== this.currentEditor.id) {
        assert(this.currentEditor.tile);
        this.backwards.push({
          ...this.currentEditor.entityLocator,
          tileId: this.currentEditor.tile.id,
          editorId: this.currentEditor.id,
        });
        console.log(`backwards added: ${JSON.stringify(last(this.backwards))}`);
      }

      this.forwards = [];
    }

    this.currentEditor = editor;
  }

  @action.bound
  public go(direction: 'forward' | 'backward') {
    const recordToOpen = this[direction === 'backward' ? 'backwards' : 'forwards'].pop();
    assert(recordToOpen && this.currentEditor?.tile);

    this[direction === 'backward' ? 'forwards' : 'backwards'].push({
      ...this.currentEditor.entityLocator,
      tileId: this.currentEditor.tile.id,
      editorId: this.currentEditor.id,
    });

    this.workbench.openEntity(recordToOpen, {
      dest: this.workbench.getTileById(recordToOpen.tileId),
      reason: 'history',
    });
  }
}
