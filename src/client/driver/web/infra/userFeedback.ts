import { Modal as antdModal, message as antdMessage } from 'antd';

import type UserFeedback from 'infra/UserFeedback';

const getContainer = () => document.querySelector('#app') as HTMLElement;

const modal: UserFeedback['modal'] = {
  success: (options) => {
    return new Promise((resolve) => {
      antdModal.success({
        ...options,
        getContainer,
        autoFocusButton: null,
        okText: '好的',
        onOk: resolve,
      });
    });
  },
};

const message: UserFeedback['message'] = {
  success: (options) => {
    return new Promise((resolve) =>
      antdMessage
        .success({ ...options, className: options.onClick ? 'cursor-pointer' : 'cursor-default' })
        .then(() => resolve()),
    );
  },
};

const userFeedback: UserFeedback = { modal, message };

export default userFeedback;
