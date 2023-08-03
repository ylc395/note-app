import { type PageFactory, REMOTE_ID } from 'infra/page';
import { getRemoteApi } from 'infra/remoteApi';
import memoize from 'lodash/memoize';

export const getPage: PageFactory = memoize(() => ({
  __remoteId: REMOTE_ID as string,
  ready() {
    return new Promise<void>((resolve) => {
      if (document.readyState !== 'loading') {
        resolve();
        return;
      }
      document.addEventListener('DOMContentLoaded', () => resolve());
    });
  },
  captureScreen: getRemoteApi(REMOTE_ID).captureScreen,
}));
