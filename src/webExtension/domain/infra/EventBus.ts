import browser, { type Tabs } from 'webextension-polyfill';
import { Emitter } from 'strict-event-emitter';
import isObject from 'lodash/isObject';
import noop from 'lodash/noop';

import { singleton } from 'tsyringe';

import {
  EventNames as TaskEventNames,
  type StartTaskEvent,
  type SubmitEvent,
  type FinishEvent,
  type CancelEvent,
} from 'model/task';

interface EventMap {
  [TaskEventNames.CancelTask]: CancelEvent;
  [TaskEventNames.FinishTask]: FinishEvent;
  [TaskEventNames.StartTask]: StartTaskEvent;
  [TaskEventNames.Submit]: SubmitEvent;
  [TaskEventNames.Preview]: void;
}

const MESSAGE_TYPE = '__MOCK_EVENT';

interface EventMessage {
  type: typeof MESSAGE_TYPE;
  event: string;
  payload?: unknown;
}

const isEventMessage = (message: unknown): message is EventMessage => {
  return (
    isObject(message) &&
    'type' in message &&
    message.type === MESSAGE_TYPE &&
    'event' in message &&
    typeof message.event === 'string'
  );
};

// comlink chrome adapter doesn't support proxy function (see https://github.com/kinglisky/comlink-adapters/tree/master#chrome-extensions-adapters)
// so we have to create a EventBus
@singleton()
export default class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emitter = new Emitter<any>();

  constructor() {
    browser.runtime.onMessage.addListener(this.handleMessage);
  }

  private readonly handleMessage = (message: unknown) => {
    if (!isEventMessage(message)) {
      return;
    }
    if (message.payload) {
      this.emitter.emit(message.event, message.payload);
    } else {
      this.emitter.emit(message.event);
    }
  };

  emit<E extends keyof EventMap>(eventName: E, e: EventMap[E], tabId?: NonNullable<Tabs.Tab['id']>) {
    const message: EventMessage = { type: MESSAGE_TYPE, event: eventName, payload: e };

    browser.runtime.sendMessage(message).catch(noop);

    if (tabId) {
      browser.tabs.sendMessage(tabId, message);
    }
  }

  on<E extends keyof EventMap>(eventName: E, cb: (args: EventMap[E]) => void) {
    this.emitter.on(eventName, cb);
  }
}
