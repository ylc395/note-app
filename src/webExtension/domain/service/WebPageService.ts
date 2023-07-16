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
}
