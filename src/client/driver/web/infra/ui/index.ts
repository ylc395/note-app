import type { UI } from 'infra/ui';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronUI?: {
      electronIpcContextmenu: UI['getActionFromContextmenu'];
      openNewWindow: UI['openNewWindow'];
    };
  }
}

export const getRootElement = () => document.querySelector('#app') as HTMLElement;

export * from './useModal';

export const ui: UI = {
  feedback: messageFeedback,
  getActionFromContextmenu: window.electronUI?.electronIpcContextmenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || window.open,
};
