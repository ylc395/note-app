import { createContext } from 'react';

import type { Modal } from 'web/infra/ui';

interface Context {
  editingModal: Modal;
  movingModal: Modal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<Context>(null as any);
