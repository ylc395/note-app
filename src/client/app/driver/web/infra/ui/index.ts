import type { UI } from '@domain/infra/ui';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronUI?: UI;
  }
}

const ui: UI = {
  feedback: messageFeedback,
  getActionFromContextmenu: window.electronUI?.getActionFromContextmenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || ((url) => (window.open(url), void 0)),
};

export default ui;
