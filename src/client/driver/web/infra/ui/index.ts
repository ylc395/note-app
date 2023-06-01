import type { ContextmenuItem, UI } from 'infra/ui';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronIpcContextmenu?: (items: ContextmenuItem[]) => Promise<string | null>;
  }
}

export const getRootElement = () => document.querySelector('#app') as HTMLElement;

export * from './useModal';

export const ui: UI = {
  feedback: messageFeedback,
  getActionFromContextmenu: window.electronIpcContextmenu || (() => Promise.resolve(null)),
};
