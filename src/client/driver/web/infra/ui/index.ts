import { container } from 'tsyringe';

import type { UI } from '@domain/app/infra/ui';
import ModalManager from '@domain/common/infra/ModalManager';
import messageFeedback from './messageFeedback';

declare global {
  interface Window {
    electronUI?: UI;
  }
}

const modalManager = container.resolve(ModalManager);

const ui: UI = {
  feedback: messageFeedback,
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(undefined)),
  openNewWindow: window.electronUI?.openNewWindow || ((url) => (window.open(url), void 0)),
  showModal: modalManager.show,
};

export default ui;
