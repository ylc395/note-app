import { container } from 'tsyringe';
import assert from 'assert';

import type { UI } from '@shared/domain/infra/ui';
import ModalManager from '@domain/common/infra/ModalManager';
import messageFeedback from './messageFeedback';

const modalManager = container.resolve(ModalManager);

const ui: UI = {
  feedback: messageFeedback,
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || ((url) => (window.open(url), void 0)),
  prompt: (token, type = 'modal') => {
    if (type === 'modal') {
      return modalManager.show(token);
    }

    assert.fail('invalid prompt type');
  },
};

export default ui;
