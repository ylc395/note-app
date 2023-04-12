import type { MaterialVO } from 'interface/material';
import { createContext } from 'react';
import { useModal, COMMON_MODAL_OPTIONS } from 'web/infra/ui';

export function useModals() {
  const creating = useModal<{ parentId: MaterialVO['parentId'] }>();

  return { modals: { creating }, modalOptions: COMMON_MODAL_OPTIONS };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ModalContext = createContext<ReturnType<typeof useModals>['modals']>(null as any);
