import uniqueId from 'lodash/uniqueId';
import { Modal as antdModal, message as antdMessage } from 'antd';

import type { CommonOutput } from 'infra/UI';

const getContainer = () => document.querySelector('#app') as HTMLElement;

const modal: CommonOutput['modal'] = {
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

const message: CommonOutput['message'] = {
  success: (options) => {
    return new Promise((resolve) => {
      const key = uniqueId('messageBox-');
      const _onClick = () => {
        options.onClick?.(() => antdMessage.destroy(key));
      };

      antdMessage
        .success({
          ...options,
          key,
          onClick: _onClick,
          className: options.onClick ? 'cursor-pointer' : 'cursor-default',
        })
        .then(() => resolve());
    });
  },
};

const commonOutput: CommonOutput = { modal, message };

export default commonOutput;
