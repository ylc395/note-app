import type { UI } from '@domain/infra/ui';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronUI?: UI;
  }
}

const ui: UI = {
  feedback: messageFeedback,
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || ((url) => (window.open(url), void 0)),
};

export default ui;
