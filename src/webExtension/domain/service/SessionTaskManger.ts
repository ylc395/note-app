import browser, { type Tabs } from 'webextension-polyfill';
import uniqueId from 'lodash/uniqueId';

import {
  type Task,
  type TaskTypes,
  type QueryTaskRequest,
  type SubmitEvent,
  type AddTaskRequest,
  EventNames,
  RequestTypes,
} from 'domain/model/task';
import EventBus from 'domain/infra/EventBus';
import MainAppClient from 'domain/infra/HttpClient';

import ConfigService from './ConfigService';
import HistoryService from './HistoryService';

export default class SessionTaskManager {
  private readonly eventBus = new EventBus();
  constructor() {
    this.eventBus.on(EventNames.Submit, this.submit.bind(this));
    this.eventBus.on(EventNames.CancelTask, ({ taskId }) => taskId && this.cancel(taskId));

    browser.runtime.onMessage.addListener((request: QueryTaskRequest | AddTaskRequest) => {
      switch (request.type) {
        case RequestTypes.QuerySessionTask:
          return Promise.resolve(this.tasks);
        case RequestTypes.AddTask:
          return this.add(request.tabId, request.action);
        default:
          break;
      }
    });
  }

  private tasks: Required<Task>[] = [];
  private client = new MainAppClient();
  private async add(tabId: NonNullable<Tabs.Tab['id']>, type: TaskTypes) {
    const tab = await browser.tabs.get(tabId);
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

    const tab = await browser.tabs.get(task.tabId);
    const config = await ConfigService.load();

    try {
      if (!config) {
        throw new Error('no config');
      }

      await this.client.save(config.targetEntityType, {
        ...result,
        sourceUrl: tab.url || '',
        parentId: config.targetEntityId,
      });

      HistoryService.add(task);
      this.eventBus.emit(EventNames.FinishTask, { taskId });
    } catch {
      this.eventBus.emit(EventNames.CancelTask, { taskId, error: 'Can not save' });
    }

    this.tasks = this.tasks.filter((t) => t !== task);
  }

  private cancel(taskId: Task['id']) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }
}
