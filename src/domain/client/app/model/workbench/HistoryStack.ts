import { action, observable, computed } from 'mobx';
import { last } from 'lodash-es';
import assert from 'assert';

import Editor from '../abstract/Editor';
import type Tile from './Tile';
import type { EntityLocator } from '#domain/shared/model/entity';

interface Record extends EntityLocator {
  tileId: Tile['id'];
  editorId: Editor['id'];
}

export enum Direction {
  BACKWARD,
  FORWARD,
}

export default class HistoryStack {
  @observable.ref public currentEditor?: Editor;

  @observable.shallow private readonly backwards: Record[] = [];

  @observable.shallow private forwards: Record[] = [];

  @computed
  public get canForward() {
    return this.forwards.length > 0;
  }

  @computed
  public get canBackward() {
    return this.backwards.length > 0;
  }

  @action
  public push(editor: Editor | null, fromHistory?: Direction) {
    if (editor === this.currentEditor) {
      return;
    }

    if (this.currentEditor) {
      const stack = fromHistory === Direction.BACKWARD ? this.forwards : this.backwards;

      if (last(stack)?.editorId !== this.currentEditor.id) {
        stack.push({
          ...this.currentEditor.entityLocator,
          tileId: this.currentEditor.tile.id,
          editorId: this.currentEditor.id,
        });
      }
    }

    if (!fromHistory) {
      this.forwards = [];
    }

    this.currentEditor = editor || undefined;
  }

  @action
  public go(direction: Direction, step = 1) {
    const stack = direction === Direction.BACKWARD ? this.backwards : this.forwards;
    assert(stack[stack.length - step] && step >= 1, `can not go ${direction}`);

    let recordToOpen;

    for (let i = 0; i < step; i++) {
      recordToOpen = stack.pop()!;
    }

    return recordToOpen!;
  }
}
