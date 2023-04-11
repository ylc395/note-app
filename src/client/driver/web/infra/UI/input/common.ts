import { Modal } from 'antd';
import type { ContextmenuItem, CommonInput } from 'infra/UI';
import { COMMON_MODAL_OPTIONS } from '../utils';

export const confirm: CommonInput['confirm'] = function (options) {
  return new Promise((resolve) => {
    Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      ...options,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

declare global {
  interface Window {
    electronIpcContextmenu?: (items: ContextmenuItem[]) => Promise<string | null>;
  }
}

const webContextmenu = () => Promise.resolve(null);

export const getContextmenuAction = window.electronIpcContextmenu || webContextmenu;
