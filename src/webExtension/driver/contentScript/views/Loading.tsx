import { observer } from 'mobx-react-lite';
import { LoadingOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';

import ClipService from 'service/ClipService';

export default observer(function Loading() {
  const clipService = container.resolve(ClipService);

  return clipService.isLoading ? (
    <div className="fixed left-1/2 top-40 z-[999] flex -translate-x-1/2 items-center rounded-3xl border border-solid border-gray-200 bg-white px-6 py-4 text-gray-500 shadow-xl">
      <LoadingOutlined className="mr-4" />
      剪切中...
    </div>
  ) : null;
});
