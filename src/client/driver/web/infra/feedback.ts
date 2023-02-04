import { Modal as antdModal, message as antdMessage } from 'antd';

import type Feedback from 'infra/Feedback';

const modal: Feedback['modal'] = {
  confirm: (options) => {
    return new Promise((resolve) => {
      antdModal.confirm({
        ...options,
        autoFocusButton: null,
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve('ok'),
        onCancel: () => resolve('cancel'),
      });
    });
  },
};

const message: Feedback['message'] = {
  success: (options) => {
    return new Promise((resolve) => antdMessage.success(options.content).then(() => resolve()));
  },
};

export default { modal, message };
