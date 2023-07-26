import browser from 'webextension-polyfill';

export default class WebPageService {
  static pageReady() {
    return new Promise<void>((resolve) => {
      if (document.readyState !== 'loading') {
        resolve();
        return;
      }
      document.addEventListener('DOMContentLoaded', () => resolve());
    });
  }

  static async captureScreen() {
    return await browser.tabs.captureVisibleTab(undefined, {
      format: 'png',
    });
  }

  static createAppRoot() {
    const container = document.createElement('div');
    document.body.append(container);
    container.style.all = 'initial';

    return container.attachShadow({ mode: 'open' });
  }
}
