import { Modal } from 'antd';

import type { CommonInputs } from 'infra/UserInput';
import { COMMON_MODAL_OPTIONS } from './utils';

export const confirm: CommonInputs['confirm'] = function (options) {
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
    electronIpcContextmenu?: CommonInputs['getContextmenuAction'];
  }
}

const webContextmenu: CommonInputs['getContextmenuAction'] = () => Promise.resolve(null);

export const getContextmenuAction = window.electronIpcContextmenu || webContextmenu;

export const getFile: CommonInputs['getFile'] = () => {
  return new Promise((resolve) => {
    const onChange = async (e: Event) => {
      const files = (e.target as HTMLInputElement).files;

      if (!files?.[0]) {
        resolve(null);
        return;
      }

      resolve(files[0].path || files[0]);
    };

    const inputEl = document.createElement('input');

    inputEl.type = 'file';
    inputEl.style.display = 'none';
    inputEl.onchange = onChange;
    inputEl.onblur = () => {
      inputEl.remove();
      resolve(null);
    };
    document.body.appendChild(inputEl);
    inputEl.click();
  });
};
