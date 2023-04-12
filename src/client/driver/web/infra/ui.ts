import { Modal, message } from 'antd';
import uniqueId from 'lodash/uniqueId';
import type { ContextmenuItem, UIInput, UIOutput } from 'infra/UI';

const confirm: UIInput['confirm'] = function (options) {
  return new Promise((resolve) => {
    Modal.confirm({
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
export const uiInput: UIInput = { confirm };

export const uiOutput: UIOutput = {
  modal: {
    success: (options) => {
      return new Promise((resolve) => {
        Modal.success({
          ...options,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          getContainer: () => document.querySelector('#app')!,
          autoFocusButton: null,
          okText: '好的',
          onOk: resolve,
        });
      });
    },
  },
  message: {
    success: (options) => {
      return new Promise((resolve) => {
        const key = uniqueId('messageBox-');
        const _onClick = () => {
          options.onClick?.(() => message.destroy(key));
        };

        message
          .success({
            ...options,
            key,
            onClick: _onClick,
            className: options.onClick ? 'cursor-pointer' : 'cursor-default',
          })
          .then(() => resolve());
      });
    },
  },
};
