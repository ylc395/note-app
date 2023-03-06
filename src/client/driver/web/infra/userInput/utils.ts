import type { ModalFuncProps } from 'antd';

const getContainer = () => document.querySelector('#app') as HTMLElement;

export const COMMON_MODAL_OPTIONS: ModalFuncProps = {
  getContainer,
  autoFocusButton: null,
  okText: '确认',
  cancelText: '取消',
  icon: null,
  keyboard: false,
  footer: null,
};
