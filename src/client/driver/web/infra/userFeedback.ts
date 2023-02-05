import { Modal as antdModal, message as antdMessage } from 'antd';

import type UserFeedback from 'infra/UserFeedback';

const modal: UserFeedback['modal'] = {
  success: (options) => {
    return new Promise((resolve) => {
      antdModal.success({
        ...options,
        autoFocusButton: null,
        okText: '好的',
        onOk: resolve,
      });
    });
  },
};

const message: UserFeedback['message'] = {
  success: (options) => {
    return new Promise((resolve) => antdMessage.success(options.content).then(() => resolve()));
  },
};

export default { modal, message };
