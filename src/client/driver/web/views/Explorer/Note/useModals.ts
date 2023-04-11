import { useBoolean } from 'ahooks';
import { useMemo, createContext } from 'react';
import type { ModalProps } from 'antd';

export const COMMON_MODAL_OPTIONS: ModalProps = {
  getContainer: () => document.querySelector('#app') as HTMLElement,
  keyboard: false,
  footer: null,
  destroyOnClose: true,
};

export function useModals() {
  const [isMoving, { setFalse: closeMoving, setTrue: openMoving }] = useBoolean(false);
  const [isEditing, { setFalse: closeEditing, setTrue: openEditing }] = useBoolean(false);

  const moving = useMemo(
    () => ({
      isOpen: isMoving,
      open: openMoving,
      close: closeMoving,
    }),
    [closeMoving, isMoving, openMoving],
  );

  const editing = useMemo(
    () => ({
      isOpen: isEditing,
      open: openEditing,
      close: closeEditing,
    }),
    [closeEditing, isEditing, openEditing],
  );

  return { moving, editing };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ModalContext = createContext<ReturnType<typeof useModals>>(null as any);
