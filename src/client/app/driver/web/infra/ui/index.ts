import type { UI, ElectronUI } from '@domain/infra/ui';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronUI?: ElectronUI;
  }
}

export const getRootElement = () => document.querySelector('#app') as HTMLElement;

export const ui: UI = {
  feedback: messageFeedback,
  getActionFromContextmenu: window.electronUI?.getActionFromContextmenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || ((url) => (window.open(url), void 0)),
};
