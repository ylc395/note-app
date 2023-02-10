import { Modal } from 'antd';

import type UserInput from 'infra/UserInput';

import { webContextmenu, ipcContextmenu } from './contextmenu';
import getNoteIdByTree from './note/getNoteIdByTree';
import editNoteMetadata from './note/editNoteMetadata';
import { COMMON_MODAL_OPTIONS } from './utils';

const userInput: UserInput = {
  common: {
    getContextmenuAction: ipcContextmenu || webContextmenu,
    confirm: (options) => {
      return new Promise((resolve) => {
        Modal.confirm({
          ...COMMON_MODAL_OPTIONS,
          ...options,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    },
  },
  note: { getNoteIdByTree, editNoteMetadata },
};

export default userInput;
