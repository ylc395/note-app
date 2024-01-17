import { container } from 'tsyringe';

import type { UI } from '@shared/domain/infra/ui';
import ModalManager from '@domain/common/infra/ModalManager';
import messageFeedback from './messageFeedback';

const modalManager = container.resolve(ModalManager);

const ui: UI = {
  feedback: messageFeedback,
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || (window.open as (v: string) => void),
  prompt: modalManager.show,
};

export default ui;
