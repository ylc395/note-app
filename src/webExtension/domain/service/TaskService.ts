import browser, { type Tabs } from 'webextension-polyfill';
import { singleton, container } from 'tsyringe';
import { computed, action, makeObservable, observable, runInAction } from 'mobx';
import delay from 'lodash/delay';

import { type Task, type CancelEvent, TaskTypes, EventNames } from 'model/task';
import EventBus from 'infra/EventBus';
import MainApp, { Statuses } from 'infra/MainApp';
import { getRemoteApi } from 'infra/remoteApi';

import ConfigService from './ConfigService';
import HistoryService from './HistoryService';
import type SessionTaskManager from './SessionTaskManger';
import type WebPageService from './WebPageService';

const sessionTaskManager = getRemoteApi<SessionTaskManager>();

@singleton()
export default class TaskService {
  @observable tasks: Required<Task>[] = [];
  @observable targetTab?: Tabs.Tab;
  private readonly eventBus = new EventBus();
  private readonly mainApp = container.resolve(MainApp);
  readonly config = new ConfigService(this.mainApp);
  @observable private isPageReady = false;

  constructor() {
    makeObservable(this);
    this.init();
    this.eventBus.on(EventNames.CancelTask, this.handleCancel.bind(this));
    this.eventBus.on(EventNames.FinishTask, ({ taskId }) => this.handleFinish(taskId));
    this.eventBus.on(EventNames.Preview, () => window.close());
  }

  private async init() {
    const tasks = await sessionTaskManager.getTasks();
    const targetTab = await TaskService.getTargetTab();
    const pageApi = getRemoteApi<typeof WebPageService>(targetTab.id);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    function getPageReady() {
      pageApi.pageReady().then(
        action(() => {
          that.isPageReady = true;
        }),
        (e) => setTimeout(getPageReady, 1000),
      );
    }

    getPageReady();
    runInAction(() => {
      this.targetTab = targetTab;
      this.tasks = tasks;
    });
  }

  private handleCancel(e: CancelEvent) {
    if (e.error) {
      window.alert(e.error);
    }

    this.remove(e.taskId);
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

  private static async getTargetTab() {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const targetTab = tabs[0];

    if (!targetTab) {
      throw new Error('no target tab');
    }

    return targetTab;
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

  @action
  private remove(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  async addTask(action: TaskTypes) {
    if (!this.targetTab?.id) {
      throw new Error('not ready');
    }

    const newTask = await sessionTaskManager.add(this.targetTab.id, action);
    this.tasks.push(newTask);

    if ([TaskTypes.SelectElement, TaskTypes.SelectElementText, TaskTypes.ScreenShot].includes(action)) {
      window.close();
    }
  }
}
