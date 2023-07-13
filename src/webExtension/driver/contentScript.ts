import browser from 'webextension-polyfill';

import ClipService from 'domain/service/ClipService';
import { type StartTaskRequest, RequestTypes } from 'domain/model/Request';

const clipService = new ClipService();
browser.runtime.onMessage.addListener(({ action, type }: StartTaskRequest) => {
  switch (type) {
    case RequestTypes.StartTask:
      return clipService.handleAction(action);
    default:
      break;
  }
});

window.addEventListener('pagehide', clipService.cancel.bind(clipService));
