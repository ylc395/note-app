import { Button } from 'antd';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';

import context from '../Context';

export default observer(function Tooltip() {
  const { hoveringAnnotationId, pdfViewer } = useContext(context);

  return (
    <div>
      <Button type="text" size="small" icon={<BgColorsOutlined />}></Button>
      <Button type="text" size="small" icon={<CommentOutlined />}></Button>
      <Button type="text" size="small" icon={<DeleteOutlined />}></Button>
    </div>
  );
});
