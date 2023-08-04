import browser, { type Tabs } from 'webextension-polyfill';
import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';

import { type Task, type TaskTypes, type SubmitEvent, EventNames } from 'model/task';
import EventBus from 'infra/EventBus';
import type { RemoteCallable, RemoteId } from 'infra/remoteApi';

import ConfigService from './ConfigService';
import HistoryService from './HistoryService';
import MainAppService from './MainAppService';

export const REMOTE_ID: RemoteId<SessionTaskManager> = 'SessionTaskManager';

export default class SessionTaskManager implements RemoteCallable {
  readonly __remoteId = REMOTE_ID as string;
  private readonly eventBus = container.resolve(EventBus);
  private readonly mainApp = container.resolve(MainAppService);
  private readonly config = container.resolve(ConfigService);
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
