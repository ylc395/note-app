import { container } from 'tsyringe';

import type { UI } from '@shared/domain/infra/ui';
import ModalManager from '@domain/common/infra/ModalManager';

const modalManager = container.resolve(ModalManager);

const ui: UI = {
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || (window.open as (v: string) => void),
  prompt: modalManager.show,
};

export default ui;
