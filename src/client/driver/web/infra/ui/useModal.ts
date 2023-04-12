import { useBoolean, useGetState } from 'ahooks';
import { useCallback, useMemo } from 'react';
import type { ModalProps } from 'antd';

export const COMMON_MODAL_OPTIONS: ModalProps = {
  getContainer: () => document.querySelector('#app') as HTMLElement,
  keyboard: false,
  footer: null,
  destroyOnClose: true,
  closable: false,
};

export function useModal<T = void>() {
  const [isOpen, { setFalse, setTrue }] = useBoolean(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData, getData] = useGetState<T>();
  const open = useCallback(
    (data: T) => {
      console.log(data);
      setData(data);
      setTrue();
    },
    [setData, setTrue],
  );
  const close = useCallback(() => {
    setData(undefined);
    setFalse();
  }, [setFalse, setData]);

  return useMemo(
    () => ({
      isOpen,
      open,
      close,
      getData,
    }),
    [close, getData, isOpen, open],
  );
}
