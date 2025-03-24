import { action, observable, computed } from 'mobx';
import assert from 'assert';

export enum Direction {
  BACKWARD = 1,
  FORWARD,
}

export interface HistoryRecord {
  key: string;
}

export default class HistoryStack<T extends HistoryRecord = HistoryRecord> {
  constructor(private readonly options?: { onPop?: (e: { record: T; direction: Direction }) => void }) {}
  @observable.ref public accessor current: T | undefined;
  @observable.shallow private accessor backwards: T[] = [];
  @observable.shallow private accessor forwards: T[] = [];

  @computed
  public get canForward() {
    return this.forwards.length > 0;
  }

  @computed
  public get canBackward() {
    return this.backwards.length > 0;
  }

  // 将当前的浏览记录压入前进/后退栈中。传入的 record 将成为当前的浏览记录
  // fromHistory 表示此浏览记录来自前进/后退栈弹出的记录
  @action
  public push({ record, fromHistory }: { record: T | null; fromHistory?: Direction }) {
    if (record?.key === this.current?.key) {
      return;
    }

    if (this.current) {
      const stack = fromHistory === Direction.BACKWARD ? this.forwards : this.backwards;
      stack.push(this.current);
    }

    this.current = record || undefined;

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

    this.options?.onPop?.({
      record: record!,
      direction,
    });
  }
}
