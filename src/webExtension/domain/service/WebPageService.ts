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
    // reset inheritance. see https://web.dev/shadowdom-v1/#resetting-inheritable-styles
    container.style.setProperty('all', 'initial', 'important');
    document.body.append(container);

    return container.attachShadow({ mode: 'open' });
  }
}
