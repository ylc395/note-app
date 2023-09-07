import { observer } from 'mobx-react-lite';
import { LoadingOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';

import PageService from 'service/PageService';

export default observer(function Loading() {
  const { isLoading } = container.resolve(PageService);

  return isLoading ? (
    <div className="message top-40">
      <LoadingOutlined className="mr-4" />
      剪切中...
    </div>
  ) : null;
});
