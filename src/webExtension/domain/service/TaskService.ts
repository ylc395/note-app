import browser, { type Tabs } from 'webextension-polyfill';
import { singleton, container } from 'tsyringe';
import { computed, action, makeObservable, observable, runInAction, reaction } from 'mobx';

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
  @observable private targetTabId?: NonNullable<Tabs.Tab['id']>;
  readonly config = new ConfigService();
  private readonly eventBus = new EventBus();
  private readonly mainApp = container.resolve(MainApp);
  @observable private isPageReady = false;

  constructor() {
    makeObservable(this);
    this.init();
    this.eventBus.on(EventNames.CancelTask, this.handleCancel.bind(this));
    this.eventBus.on(EventNames.FinishTask, ({ taskId }) => this.handleFinish(taskId));
  }

  private async init() {
    const tasks = await sessionTaskManager.getTasks();
    const targetTabId = await TaskService.getTargetTabId();
    const pageApi = getRemoteApi<typeof WebPageService>(targetTabId);

    pageApi.pageReady().then(
      action(() => {
        this.isPageReady = true;
      }),
    );

    runInAction(() => {
      this.targetTabId = targetTabId;
      this.tasks = tasks;
    });

    reaction(() => this.config.get('targetEntityType'), this.config.updateTargetTree, { fireImmediately: true });
  }

  private handleCancel(e: CancelEvent) {
    if (e.error) {
      window.alert(e.error);
    }

    this.remove(e.taskId);
  }

  @computed
  get currentAction() {
    if (typeof this.targetTabId === 'undefined') {
      return undefined;
    }

    return this.tasks.find((task) => task.tabId === this.targetTabId)?.type;
  }

  @computed
  get isUnavailable() {
    return !this.isPageReady || this.mainApp.status !== Statuses.Online || Boolean(this.currentAction);
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

  @action
  private remove(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  async addTask(action: TaskTypes) {
    if (typeof this.targetTabId === 'undefined') {
      throw new Error('not ready');
    }

    await sessionTaskManager.add(this.targetTabId, action);
    window.close();
  }
}
