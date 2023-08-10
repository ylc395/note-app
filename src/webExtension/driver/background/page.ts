import browser from 'webextension-polyfill';
import { REMOTE_ID as PAGE_REMOTE_ID, PageFactory } from 'infra/page';

export const getPage: PageFactory = () => {
  return {
    __remoteId: PAGE_REMOTE_ID as string,
    async captureScreen() {
      return await browser.tabs.captureVisibleTab(undefined, {
        format: 'png',
      });
    },
  };
};
