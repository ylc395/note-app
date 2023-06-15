import type { ReactNode } from 'react';
import { Modal as AntdModal, type ModalProps } from 'antd';

const COMMON_MODAL_OPTIONS: ModalProps = {
  getContainer: () => document.querySelector('#app') as HTMLElement,
  keyboard: false,
  footer: null,
  destroyOnClose: true,
  closable: false,
};

export default function Modal({ children, ...modalProps }: { children: ReactNode } & ModalProps) {
  return (
    <AntdModal {...COMMON_MODAL_OPTIONS} {...modalProps}>
      {children}
    </AntdModal>
  );
}
