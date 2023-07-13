import browser, { type Tabs } from 'webextension-polyfill';
import { singleton } from 'tsyringe';
import { computed, makeObservable, observable, runInAction } from 'mobx';

import { AddTaskRequest, CancelTaskRequest, FinishTaskRequest, RequestTypes } from 'domain/model/Request';
import { Task, TaskTypes } from 'domain/model/Task';

@singleton()
export default class TaskService {
  constructor() {
    makeObservable(this);
    this.init();
    this.listen();
  }
  @observable private tasks: Task[] = [];

  @observable targetTabId?: NonNullable<Tabs.Tab['id']>;

  private async init() {
    this.tasks = await browser.runtime.sendMessage({ type: RequestTypes.QuerySessionTasks });

    const targetTabId = await TaskService.getTargetTabId();
    runInAction(() => {
      this.targetTabId = targetTabId;
    });
  }

  private listen() {
    browser.runtime.onMessage.addListener((request: CancelTaskRequest | FinishTaskRequest, sender) => {
      switch (request.type) {
        case RequestTypes.CancelTask:
        case RequestTypes.FinishTask:
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return this.remove(sender.tab!.id!);
        default:
          break;
      }
    });
  }

  @computed
  get currentAction() {
    if (typeof this.targetTabId === 'undefined') {
      return null;
    }

    return this.tasks.find((task) => task.tabId === this.targetTabId)?.type;
  }

  private static async getTargetTabId() {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const targetTabId = tabs[0]?.id;

    if (!targetTabId) {
      throw new Error('no target tab');
    }

    return targetTabId;
  }

  private remove(tabId: NonNullable<Tabs.Tab['id']>) {
    this.tasks = this.tasks.filter((task) => task.tabId !== tabId);
  }

  async dispatch(action: TaskTypes) {
    if (typeof this.targetTabId === 'undefined') {
      throw new Error('not ready');
    }

    const task: Task = await browser.runtime.sendMessage({
      type: RequestTypes.AddTask,
      task: { tabId: this.targetTabId, type: action },
    } satisfies AddTaskRequest);

    if (action === TaskTypes.ScreenShot || action === TaskTypes.SelectElement) {
      window.close();
      return;
    }

    runInAction(() => {
      this.tasks.push(task);
    });
  }
}
