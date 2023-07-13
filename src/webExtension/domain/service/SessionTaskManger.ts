import browser, { type Tabs } from 'webextension-polyfill';
import omit from 'lodash/omit';

import { type Task, type TaskTypes, TASK_ID_PREFIX } from 'domain/model/Task';
import { RequestTypes, StartTaskRequest } from 'domain/model/Request';

export default class SessionTaskManager {
  private tasks: Task[] = [];
  async add(tabId: NonNullable<Tabs.Tab['id']>, type: TaskTypes) {
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

  async finish(tabId: NonNullable<Tabs.Tab['id']>) {
    const task: Task | undefined = this.tasks.find((task) => task.tabId === tabId);

    if (!task) {
      throw new Error('invalid tab id');
    }

    this.tasks = this.tasks.filter((t) => t !== task);
    browser.storage.local.set({ [task.id]: omit(task, 'tabId') });
  }

  cancel(tabId: NonNullable<Tabs.Tab['id']>) {
    this.tasks = this.tasks.filter((task) => task.tabId !== tabId);
  }

  get() {
    return this.tasks;
  }
}
