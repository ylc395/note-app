import { Modal } from 'antd';

import type UserInput from 'infra/UserInput';

import { webContextmenu, ipcContextmenu } from './contextmenu';
import getNoteIdByTree from './note/getNoteIdByTree';
import editNotes from './note/editNotes';

const getContainer = () => document.querySelector('#app') as HTMLElement;

const userInput: UserInput = {
  common: {
    getContextmenuAction: ipcContextmenu || webContextmenu,
    confirm: (options) => {
      return new Promise((resolve) => {
        Modal.confirm({
          ...options,
          getContainer,
          autoFocusButton: null,
          okText: '确认',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    },
  },
  note: { getNoteIdByTree, editNotes },
};

export default userInput;
