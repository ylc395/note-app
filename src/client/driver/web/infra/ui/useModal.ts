import { useBoolean } from 'ahooks';
import { useMemo } from 'react';
import type { ModalProps } from 'antd';

export const COMMON_MODAL_OPTIONS: ModalProps = {
  getContainer: () => document.querySelector('#app') as HTMLElement,
  keyboard: false,
  footer: null,
  destroyOnClose: true,
};

export function useModal() {
  const [isOpen, { setFalse, setTrue }] = useBoolean(false);

  return useMemo(
    () => ({
      isOpen,
      open: setTrue,
      close: setFalse,
    }),
    [isOpen, setFalse, setTrue],
  );
}
