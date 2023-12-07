import { message } from 'antd';
import { uniqueId } from 'lodash';
import type { UI } from '@domain/infra/ui';

const feedback: UI['feedback'] = function (options) {
  return new Promise((resolve) => {
    const key = uniqueId('messageBox-');
    const _onClick = () => {
      options.onClick?.();
      () => message.destroy(key);
    };

    message[options.type === 'fail' ? 'error' : 'success']({
      content: options.content,
      key,
      onClick: _onClick,
      className: options.onClick ? 'cursor-pointer' : 'cursor-default',
    }).then(() => resolve());
  });
};

export default feedback;
