import { createContext } from 'react';

import type useModal from '@components/Modal/useModal';

interface Context {
  editingModal: ReturnType<typeof useModal>;
  movingModal: ReturnType<typeof useModal>;
}

export default createContext<Context>(null as never);
