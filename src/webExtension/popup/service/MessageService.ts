import browser from 'webextension-polyfill';

import type { ActionRequest, Actions } from 'interface/payload';

export default class MessageService {
  static async invoke(action: Actions) {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const targetTabId = tabs[0]?.id;

    if (!targetTabId) {
      throw new Error('no target tab');
    }

    await browser.tabs.sendMessage(targetTabId, { action } satisfies ActionRequest);
  }
}
