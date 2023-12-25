import { createContext } from 'react';

import type { Modal } from '@web/components/Modal';

interface Context {
  editingModal: Modal;
  movingModal: Modal;
}

export default createContext<Context>(null as never);
