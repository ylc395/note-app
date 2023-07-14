import browser, { type Tabs } from 'webextension-polyfill';
import { singleton, container } from 'tsyringe';
import { computed, makeObservable, observable, runInAction } from 'mobx';

import { type Task, TaskTypes, RequestTypes, EventNames, AddTaskRequest } from 'domain/model/task';
import EventBus from 'domain/infra/EventBus';
import ConfigService from './ConfigService';
import HistoryService from './HistoryService';

@singleton()
export default class TaskService {
  @observable private tasks: Required<Task>[] = [];
  @observable targetTabId?: NonNullable<Tabs.Tab['id']>;
  readonly config = new ConfigService();
  private readonly eventBus = new EventBus();

  constructor() {
    makeObservable(this);
    this.init();
    this.eventBus.on(EventNames.CancelTask, ({ taskId }) => this.remove(taskId));
    this.eventBus.on(EventNames.FinishTask, ({ taskId }) => this.handleFinish(taskId));
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

  private handleFinish(taskId: Task['id']) {
    const task = this.tasks.find(({ id }) => id === taskId);

    if (!task) {
      throw new Error('invalid taskId');
    }
    this.remove(taskId);

    const history = container.resolve(HistoryService);
    history.add(task);
  }

  private remove(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  async addTask(action: TaskTypes) {
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
