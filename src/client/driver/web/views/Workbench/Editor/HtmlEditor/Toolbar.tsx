import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Button } from 'antd';
import { SelectOutlined } from '@ant-design/icons';

import ctx from './Context';

export default observer(function Toolbar() {
  const { htmlViewer } = useContext(ctx);

  return (
    <div className="relative border-0 border-b border-solid border-gray-200 shadow-sm">
      <h2 className="m-0 py-2 text-center text-sm font-normal text-gray-400">{htmlViewer?.title.text}</h2>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button
          icon={<SelectOutlined />}
          disabled={htmlViewer?.elementSelector.isEnabled}
          onClick={() => htmlViewer?.elementSelector.enable()}
          size="small"
          type="text"
        />
      </div>
    </div>
  );
});
