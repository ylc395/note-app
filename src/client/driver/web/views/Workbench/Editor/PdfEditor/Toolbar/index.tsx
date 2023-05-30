import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { useContext } from 'react';
import { OrderedListOutlined } from '@ant-design/icons';

import context from '../Context';
import PageSwitcher from './PageSwitcher';
import ScaleChanger from './ScaleChanger';
import { Panels } from '../PdfViewer';

export default observer(function Toolbar() {
  const { pdfViewer } = useContext(context);

  return (
    <div className="relative flex items-center">
      <Button
        onClick={() => pdfViewer?.togglePanel(Panels.Outline)}
        className="mr-4"
        type="text"
        size="small"
        icon={<OrderedListOutlined />}
      />
      <ScaleChanger />
      <PageSwitcher />
    </div>
  );
});
