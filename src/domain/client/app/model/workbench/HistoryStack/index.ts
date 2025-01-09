import { action, observable, computed } from 'mobx';
import assert from 'assert';

import EventBus from '#domain/client/shared/infra/EventBus';
import Editor from '../../note/editor/BaseEditor';
import { type Record, Direction } from './types';
import { EventNames, type Events } from './events';

export * from './types';

export default class HistoryStack {
  public readonly events = new EventBus<Events>('historyStack');

  @observable.ref public accessor current: Editor | undefined;

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

  // 将当前的浏览记录压入前进/后退栈中。传入的 editor 将成为当前的浏览记录
  // fromHistory 表示此浏览记录来自前进/后退栈弹出的记录
  @action
  public push({ editor, fromHistory }: { editor: Editor | null; fromHistory?: Direction }) {
    if (editor === this.current) {
      return;
    }

    if (this.current) {
      const stack = fromHistory === Direction.BACKWARD ? this.forwards : this.backwards;

      stack.push({
        entityId: this.current.entityId,
        entityType: this.current.entityType,
        tileId: this.current.tile.id,
        editorId: this.current.id,
      });
    }

    this.current = editor || undefined;

    if (!fromHistory) {
      this.forwards = [];
    }
  }

  // 将一个浏览记录从前进/后退栈中弹出。该方法仅仅负责弹出，不维护其他状态
  @action
  public pop(direction: Direction, step = 1) {
    const stack = direction === Direction.BACKWARD ? this.backwards : this.forwards;
    assert(stack[stack.length - step], 'invalid step');

    let record;

    for (let i = 0; i < step; i++) {
      record = stack.pop()!;
    }

    this.events.emit(EventNames.Pop, {
      record: record!,
      direction,
    });
  }

  public static readonly eventNames = EventNames;
}
