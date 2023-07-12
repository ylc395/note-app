import browser from 'webextension-polyfill';
import ClipService from './service/ClipService';
import type { ActionRequest } from 'interface/payload';

const clipService = new ClipService();

browser.runtime.onMessage.addListener(({ action }: ActionRequest) => {
  clipService.handleAction(action);
});
