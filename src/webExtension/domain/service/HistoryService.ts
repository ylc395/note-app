import { observable, runInAction, makeObservable, action } from 'mobx';
import browser from 'webextension-polyfill';
import { singleton } from 'tsyringe';
import omit from 'lodash/omit';

import type { Task } from 'model/task';

const HISTORY_KEY = 'history';

@singleton()
export default class HistoryService {
  @observable historyRecords: Task[] = [];

  constructor() {
    makeObservable(this);
  }

  async refresh() {
    const data = await HistoryService.load();

    runInAction(() => {
      this.historyRecords = data || [];
    });
  }

  static async load() {
    return (await browser.storage.local.get(HISTORY_KEY))[HISTORY_KEY] as Task[] | undefined;
  }

  static async add(task: Task) {
    const history = (await browser.storage.local.get('history')).history || [];
    history.push(omit(task, ['tabId', 'id']));

    await browser.storage.local.set({ history });
  }

  @action
  add(task: Task) {
    this.historyRecords.push(task);
  }

  @action.bound
  clear() {
    browser.storage.local.remove(HISTORY_KEY);
    this.historyRecords = [];
  }
}
