import { Button } from 'antd';
import { useContext, forwardRef, type CSSProperties } from 'react';
import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';

import context from './Context';

interface Props {
  style?: CSSProperties;
  attributes?: Record<string, string>;
}

// eslint-disable-next-line mobx/missing-observer
export default forwardRef<HTMLDivElement | null, Props>(function HighlightTooltip({ style, attributes }, ref) {
  const { pdfViewer } = useContext(context);

  return (
    <div ref={ref} style={style} {...attributes}>
      <Button type="text" size="small" icon={<BgColorsOutlined />}></Button>
      <Button type="text" size="small" icon={<CommentOutlined />}></Button>
      <Button type="text" size="small" icon={<DeleteOutlined />}></Button>
    </div>
  );
});
