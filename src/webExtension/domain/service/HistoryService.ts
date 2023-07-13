import { observable, runInAction, makeObservable, action } from 'mobx';
import browser from 'webextension-polyfill';
import { singleton } from 'tsyringe';

import { type Task, TASK_ID_PREFIX } from 'domain/model/Task';

@singleton()
export default class HistoryService {
  @observable historyRecords: Task[] = [];

  constructor() {
    makeObservable(this);
    this.init();
  }

  private async init() {
    browser.storage.onChanged.addListener((changes) => {
      for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key.startsWith(TASK_ID_PREFIX) && !oldValue && newValue) {
          this.historyRecords.push(newValue);
        }
      }
    });

    const data = await browser.storage.local.get(null);

    runInAction(() => {
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(TASK_ID_PREFIX)) {
          this.historyRecords.push(value);
        }
      }
    });
  }

  @action.bound
  clear() {
    browser.storage.local.remove(this.historyRecords.map((task) => task.id));
    this.historyRecords = [];
  }
}
