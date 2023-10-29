import type { Tabs } from 'webextension-polyfill';
import { singleton, container } from 'tsyringe';
import { computed, action, makeObservable, observable, runInAction } from 'mobx';

import { type Task, type CancelEvent, TaskTypes, EventNames } from 'model/task';
import { Statuses } from 'model/mainApp';
import EventBus from 'infra/EventBus';

import ConfigService from './ConfigService';
import HistoryService from './HistoryService';
import MainAppService from './MainAppService';
import BackgroundService from './BackgroundService';
import PageService from './PageService';

@singleton()
export default class TaskService {
  private readonly background = container.resolve(BackgroundService);
  private readonly mainApp = container.resolve(MainAppService);
  private readonly history = container.resolve(HistoryService);
  private readonly eventBus = container.resolve(EventBus);
  @observable tasks: Required<Task>[] = [];
  @observable targetTab?: Tabs.Tab;
  readonly config = container.resolve(ConfigService);
  @observable private isPageReady = false;

  constructor() {
    makeObservable(this);
    this.init();
    this.eventBus.on(EventNames.CancelTask, this.handleCancel.bind(this));
    this.eventBus.on(EventNames.FinishTask, ({ taskId }) => this.handleFinish(taskId));
    this.eventBus.on(EventNames.Preview, () => window.close());
  }

  private async init() {
    const targetTab = await this.background.getActiveTab();
    const page = PageService.fromTabId(targetTab.id);

    const getPageReady = () => {
      page.ready().then(
        action(() => {
          this.isPageReady = true;
        }),
        () => setTimeout(getPageReady, 1000),
      );
    };

    getPageReady();

    runInAction(() => {
      this.targetTab = targetTab;
    });

    await this.updateTasks();
  }

  private async updateTasks() {
    const tasks = await this.background.getTasks();
    runInAction(() => {
      this.tasks = tasks;
    });
  }

  private handleCancel(e: CancelEvent) {
    if (e.error) {
      window.alert(e.error);
    }

    this.updateTasks();
  }

  @computed
  get currentAction() {
    const { targetTab } = this;

    if (!targetTab) {
      return undefined;
    }

    return this.tasks.find((task) => task.tabId === targetTab.id)?.type;
  }

  @computed
  get readyState() {
    if (this.mainApp.status !== Statuses.Online) {
      return 'APP_NOT_READY';
    }

    if (!this.isPageReady) {
      return 'PAGE_NOT_READY';
    }

    if (this.currentAction) {
      return 'DOING';
    }

    return 'READY';
  }

  private handleFinish(taskId: Task['id']) {
    const task = this.tasks.find(({ id }) => id === taskId);

    if (!task) {
      throw new Error('invalid taskId');
    }

    this.history.add(task);
    this.updateTasks();
  }

  async addTask(action: TaskTypes) {
    if (!this.targetTab?.id) {
      throw new Error('not ready');
    }

    const newTask = await this.background.add(this.targetTab.id, action);

    PageService.fromTabId(newTask.tabId).doTask(newTask);
    this.updateTasks();

    if ([TaskTypes.SelectElement, TaskTypes.SelectElementText, TaskTypes.ScreenShot].includes(action)) {
      window.close();
    }
  }
}
