import browser, { type Tabs } from 'webextension-polyfill';
import { Emitter } from 'strict-event-emitter';
import isObject from 'lodash/isObject';

import {
  EventNames,
  type StartTaskEvent,
  type SubmitEvent,
  type FinishEvent,
  type CancelEvent,
} from 'domain/model/task';

interface TaskEventMap {
  [EventNames.CancelTask]: CancelEvent;
  [EventNames.FinishTask]: FinishEvent;
  [EventNames.StartTask]: StartTaskEvent;
  [EventNames.Submit]: SubmitEvent;
}

export default class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emitter = new Emitter<any>();

  constructor() {
    browser.runtime.onMessage.addListener(this.handleMessage);
  }

  private readonly handleMessage = (message: unknown) => {
    if (isObject(message) && 'type' in message && typeof message.type === 'string') {
      if ('payload' in message) {
        this.emitter.emit(message.type, message.payload);
      } else {
        this.emitter.emit(message.type);
      }
    }
  };

  emit<E extends keyof TaskEventMap>(eventName: E, e: TaskEventMap[E], tabId?: NonNullable<Tabs.Tab['id']>) {
    const message = { type: eventName, payload: e };
    browser.runtime.sendMessage(message);

    if (tabId) {
      browser.tabs.sendMessage(tabId, message);
    }
  }

  on<E extends keyof TaskEventMap>(eventName: E, cb: (args: TaskEventMap[E]) => void) {
    this.emitter.on(eventName, cb);
  }
}
