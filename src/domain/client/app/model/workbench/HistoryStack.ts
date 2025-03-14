import { action, observable, computed } from 'mobx';
import assert from 'assert';

import type { EntityId } from '#domain/shared/model/entity';
import Editor from '../note/editor/BaseEditor';

export interface Record {
  entityId: EntityId;
  editorId: Editor['id'];
  mimeType: string | null;
}

export enum Direction {
  BACKWARD = 1,
  FORWARD,
}

// 这里的历史管理，更类似于焦点历史管理
export default class HistoryStack {
  constructor(private readonly options: { onPop: (e: { record: Record; direction: Direction }) => void }) {}

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
        editorId: this.current.id,
        mimeType: this.current.mimeType,
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

    this.options.onPop({
      record: record!,
      direction,
    });
  }
}
