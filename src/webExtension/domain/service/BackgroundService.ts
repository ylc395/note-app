import browser, { type Tabs } from 'webextension-polyfill';
import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';

import { EventNames as TaskEventNames, type TaskTypes, type Task, type SubmitEvent } from 'model/task';
import EventBus from 'infra/EventBus';

import ConfigService from './ConfigService';
import HistoryService from './HistoryService';
import MainAppService from './MainAppService';

export default class BackgroundService {
  private readonly eventBus = container.resolve(EventBus);
  private readonly config = container.resolve(ConfigService);
  private readonly mainApp = container.resolve(MainAppService);
  private tasks: Required<Task>[] = [];

  getTasks() {
    return Promise.resolve(this.tasks);
  }

  constructor() {
    this.eventBus.on(TaskEventNames.Submit, this.submit.bind(this));
    this.eventBus.on(TaskEventNames.CancelTask, ({ taskId }) => taskId && this.cancel(taskId));
  }

  async add(tabId: NonNullable<Tabs.Tab['id']>, type: TaskTypes) {
    const tab = await browser.tabs.get(tabId);
    const id = uniqueId('task-');
    const targetType = this.config.get('targetEntityType');
    const targetIds = this.config.get('targetEntityId');

    if (!targetType || !targetIds) {
      throw new Error('no config');
    }

    const task: Required<Task> = {
      time: Date.now(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: tab.url!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      title: tab.title!,
      type,
      tabId,
      id,
      targetType,
      targetId: targetIds[targetType],
    };

    this.tasks.push(task);
    this.eventBus.emit(TaskEventNames.StartTask, { task });

    return task;
  }

  private async submit({ taskId, ...result }: SubmitEvent) {
    const task = this.tasks.find((task) => task.id === taskId);

    if (!task) {
      throw new Error(`invalid task id: ${taskId}`);
    }

    this.tasks = this.tasks.filter((t) => t !== task);

    try {
      await this.mainApp.saveToMainApp(task.targetType, {
        ...result,
        sourceUrl: task.url,
        parentId: task.targetId,
      });

      HistoryService.add(task);
      this.eventBus.emit(TaskEventNames.FinishTask, { taskId }, task.tabId);
    } catch (e) {
      this.eventBus.emit(TaskEventNames.CancelTask, { taskId, error: `Can not save: ${e}` }, task.tabId);
    }
  }

  private cancel(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  async captureScreen() {
    return await browser.tabs.captureVisibleTab(undefined, {
      format: 'png',
    });
  }

  async getActiveTab() {
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
}
