import { Modal } from 'antd';

import type UserInput from 'infra/UserInput';

import { webContextmenu, ipcContextmenu } from './contextmenu';
import getNoteIdByTree from './getNoteIdByTree';

const userInput: UserInput = {
  common: {
    getContextmenuAction: ipcContextmenu || webContextmenu,
    confirm: (options) => {
      return new Promise((resolve) => {
        Modal.confirm({
          ...options,
          autoFocusButton: null,
          okText: '确认',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    },
  },
  note: { getNoteIdByTree },
};

export default userInput;
