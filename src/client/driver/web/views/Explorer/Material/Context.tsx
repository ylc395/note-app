import { createContext } from 'react';
import type useModal from 'web/components/Modal/useModal';
import type { MaterialVO } from 'interface/material';

export interface Context {
  newMaterialModal: ReturnType<typeof useModal>;
  currentMaterialId: MaterialVO['id'] | null;
  setCurrentMaterialId: (id: MaterialVO['parentId']) => void;
}

export default createContext<Context>(null as never);
