import browser, { type Tabs } from 'webextension-polyfill';
import { singleton } from 'tsyringe';
import { computed, makeObservable, observable, runInAction } from 'mobx';

import { type Task, TaskTypes, RequestTypes, EventNames, AddTaskRequest } from 'domain/model/task';
import EventBus from 'domain/infra/EventBus';

@singleton()
export default class TaskService {
  @observable private tasks: Task[] = [];
  @observable targetTabId?: NonNullable<Tabs.Tab['id']>;
  private readonly eventBus = new EventBus();
  constructor() {
    makeObservable(this);
    this.init();
    this.eventBus.on(EventNames.CancelTask, ({ taskId }) => this.remove(taskId));
    this.eventBus.on(EventNames.FinishTask, ({ taskId }) => this.remove(taskId));
  }

  private async init() {
    this.tasks = await browser.runtime.sendMessage({ type: RequestTypes.QuerySessionTask });
    const targetTabId = await TaskService.getTargetTabId();

    runInAction(() => {
      this.targetTabId = targetTabId;
    });
  }

  @computed
  get currentAction() {
    if (typeof this.targetTabId === 'undefined') {
      return undefined;
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

  private remove(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  async dispatch(action: TaskTypes) {
    if (typeof this.targetTabId === 'undefined') {
      throw new Error('not ready');
    }

    const task = await browser.runtime.sendMessage({
      type: RequestTypes.AddTask,
      action,
      tabId: this.targetTabId,
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
