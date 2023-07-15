import browser from 'webextension-polyfill';

import { RequestTypes, type HasSelectionRequest } from 'domain/model/task';
import ClipService from 'domain/service/ClipService';

new ClipService();

browser.runtime.onMessage.addListener((request: HasSelectionRequest) => {
  switch (request.type) {
    case RequestTypes.HasSelection:
      return Promise.resolve(ClipService.hasSelection());
    default:
      break;
  }
});
