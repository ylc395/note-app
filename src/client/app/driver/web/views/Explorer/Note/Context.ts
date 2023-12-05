import { createContext } from 'react';

import type { Modal } from '@components/Modal';

interface Context {
  editingModal: Modal;
  movingModal: Modal;
}

export default createContext<Context>(null as never);
