import { action, observable, computed } from 'mobx';
import { last } from 'lodash-es';
import assert from 'assert';

import EventBus from '#domain/client/app/infra/EventBus';
import Editor from '../../../abstract/Editor';
import { type Record, Direction } from './types';
import { EventNames, type Events } from './events';

export * from './types';

export default class HistoryStack {
  public readonly events = new EventBus<Events>('historyStack');

  @observable.ref public accessor currentEditor: Editor | undefined;

  @observable.shallow private accessor backwards: Record[] = [];

  @observable.shallow private accessor forwards: Record[] = [];

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
  public pop(direction: Direction, step = 1) {
    const stack = direction === Direction.BACKWARD ? this.backwards : this.forwards;
    assert(stack[stack.length - step] && step >= 1, `can not go ${direction}`);

    let recordToOpen;

    for (let i = 0; i < step; i++) {
      recordToOpen = stack.pop()!;
    }

    return recordToOpen!;
  }

  public static readonly eventNames = EventNames;
}
