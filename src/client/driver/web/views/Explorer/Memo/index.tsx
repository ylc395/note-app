import { observer } from 'mobx-react-lite';
import { Button } from 'antd';

import MarkdownEditor from 'web/components/MarkdownEditor';

export default observer(() => {
  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-base">思考碎片</h1>
        </div>
      </div>
      <div>
        <div className="h-60 cursor-text border border-solid border-gray-300">
          <MarkdownEditor onChange={() => void 0} />
        </div>
        <div>
          <Button type="primary">创建</Button>
        </div>
      </div>
    </div>
  );
});
