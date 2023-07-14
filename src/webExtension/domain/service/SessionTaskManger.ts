import browser, { type Tabs } from 'webextension-polyfill';
import omit from 'lodash/omit';

import { type Task, type TaskTypes, TASK_ID_PREFIX } from 'domain/model/Task';
import {
  RequestTypes,
  type SubmitRequest,
  type StartTaskRequest,
  type CancelTaskRequest,
  type FinishTaskRequest,
  type QueryTaskRequest,
  type AddTaskRequest,
} from 'domain/model/Request';
import MainAppClient from './HttpClient';

export default class SessionTaskManager {
  constructor() {
    browser.runtime.onMessage.addListener(
      (request: QueryTaskRequest | AddTaskRequest | SubmitRequest | CancelTaskRequest, sender) => {
        switch (request.type) {
          case RequestTypes.QuerySessionTasks:
            return Promise.resolve(this.tasks);
          case RequestTypes.AddTask:
            return this.add(request.task.tabId, request.task.type);
          case RequestTypes.Submit:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.submit(sender.tab!.id!, request.payload);
          case RequestTypes.CancelTask:
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.cancel(sender.tab!.id!);
          default:
            break;
        }
      },
    );
  }

  private tasks: Task[] = [];
  private client = new MainAppClient();
  private async add(tabId: NonNullable<Tabs.Tab['id']>, type: TaskTypes) {
    const tab = await browser.tabs.get(tabId);
    const timestamp = Date.now();
    const id = `${TASK_ID_PREFIX}${timestamp}`;
    const task: Task = {
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
    browser.tabs.sendMessage(tabId, { type: RequestTypes.StartTask, action: type } satisfies StartTaskRequest);

    return task;
  }

  private async submit(tabId: NonNullable<Tabs.Tab['id']>, result: SubmitRequest['payload']) {
    const task: Task | undefined = this.tasks.find((task) => task.tabId === tabId);
    const tab = await browser.tabs.get(tabId);

    if (!task || !tab) {
      throw new Error(`invalid tab id: ${tabId}`);
    }

    try {
      await this.client.save({ ...result, sourceUrl: tab.url || '' });
      browser.storage.local.set({ [task.id]: omit(task, 'tabId') });
      browser.runtime.sendMessage({ type: RequestTypes.FinishTask, tabId } satisfies FinishTaskRequest);
    } catch {
      const message: CancelTaskRequest = {
        type: RequestTypes.CancelTask,
        tabId,
        error: 'Can not save',
      };
      browser.tabs.sendMessage(tabId, message);
      browser.runtime.sendMessage(message);
    }

    this.tasks = this.tasks.filter((t) => t !== task);
  }

  private cancel(tabId: NonNullable<Tabs.Tab['id']>) {
    this.tasks = this.tasks.filter((task) => task.tabId !== tabId);
  }
}
