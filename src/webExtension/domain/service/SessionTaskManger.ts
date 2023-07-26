import browser, { type Tabs } from 'webextension-polyfill';
import uniqueId from 'lodash/uniqueId';

import { type Task, type TaskTypes, type SubmitEvent, EventNames } from 'model/task';
import EventBus from 'infra/EventBus';
import MainApp from 'infra/MainApp';

import ConfigService from './ConfigService';
import HistoryService from './HistoryService';

export default class SessionTaskManager {
  private readonly eventBus = new EventBus();
  private mainApp = new MainApp();
  private tasks: Required<Task>[] = [];

  getTasks() {
    return Promise.resolve(this.tasks);
  }

  constructor() {
    this.eventBus.on(EventNames.Submit, this.submit.bind(this));
    this.eventBus.on(EventNames.CancelTask, ({ taskId }) => taskId && this.cancel(taskId));
  }

  async add(tabId: NonNullable<Tabs.Tab['id']>, type: TaskTypes) {
    const tab = await browser.tabs.get(tabId);
    const config = await ConfigService.load();
    const id = uniqueId('task-');
    const task: Required<Task> = {
      time: Date.now(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: tab.url!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      title: tab.title!,
      type,
      tabId,
      id,
      targetType: config.targetEntityType,
      targetId: config.targetEntityId[config.targetEntityType],
    };

    this.tasks.push(task);
    this.eventBus.emit(EventNames.StartTask, { task }, tabId);

    return task;
  }

  private async submit({ taskId, ...result }: SubmitEvent) {
    const task = this.tasks.find((task) => task.id === taskId);

    if (!task) {
      throw new Error(`invalid task id: ${taskId}`);
    }

    try {
      await this.mainApp.save(task.targetType, {
        ...result,
        sourceUrl: task.url,
        parentId: task.targetId,
      });

      HistoryService.add(task);
      this.eventBus.emit(EventNames.FinishTask, { taskId });
    } catch (e) {
      this.eventBus.emit(EventNames.CancelTask, { taskId, error: `Can not save: ${e}` }, task.tabId);
    }

    this.tasks = this.tasks.filter((t) => t !== task);
  }

  private cancel(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }
}
