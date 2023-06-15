import type { UI } from 'infra/ui';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronUI?: {
      getActionFromContextmenu: UI['getActionFromContextmenu'];
      openNewWindow: UI['openNewWindow'];
    };
  }
}

export const getRootElement = () => document.querySelector('#app') as HTMLElement;

export const ui: UI = {
  feedback: messageFeedback,
  getActionFromContextmenu: window.electronUI?.getActionFromContextmenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || window.open,
};
