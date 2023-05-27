import { Button } from 'antd';
import { useContext, forwardRef, type CSSProperties, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import { runInAction } from 'mobx';

import context from './Context';

interface Props {
  style?: CSSProperties;
}

export default observer(
  forwardRef<HTMLDivElement | null, Props>(
    // eslint-disable-next-line mobx/missing-observer
    function HighlightTooltip({ style }, ref) {
      const ctx = useContext(context);
      const { pdfViewer, hoveringAnnotationEl } = ctx;
      const handleRemove = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const editor = pdfViewer!.editor;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const annotationId = hoveringAnnotationEl!.dataset.annotationId!;
        editor.removeAnnotation(annotationId);

        runInAction(() => {
          ctx.hoveringAnnotationEl = null;
        });
      }, [ctx, hoveringAnnotationEl, pdfViewer]);

      return (
        <div ref={ref} style={style} className="z-10 rounded bg-gray-600">
          <div>
            <Button className="text-white" type="text" icon={<BgColorsOutlined />} />
            <Button className="text-white" type="text" icon={<CommentOutlined />} />
            <Button className="text-white" type="text" icon={<DeleteOutlined />} onClick={handleRemove} />
          </div>
        </div>
      );
    },
  ),
);
