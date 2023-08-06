import { observer } from 'mobx-react-lite';
import { LoadingOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';

import ClipService from 'service/ClipService';

export default observer(function Loading() {
  const {isLoading} = container.resolve(ClipService);

  return isLoading ? (
    <div className="message top-40">
      <LoadingOutlined className="mr-4" />
      剪切中...
    </div>
  ) : null;
});
