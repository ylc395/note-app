import { Button } from 'antd';
import { useState, useContext, forwardRef, type CSSProperties, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import { runInAction } from 'mobx';

import type { HighlightColors } from 'model/material/PdfEditor';
import context from './Context';
import SelectionTooltip from './SelectionTooltip';
import CommentTextArea from './CommentTextArea';

interface Props {
  style?: CSSProperties;
}

export default observer(
  forwardRef<HTMLDivElement | null, Props>(
    // eslint-disable-next-line mobx/missing-observer
    function HighlightTooltip({ style }, ref) {
      const ctx = useContext(context);
      const { pdfViewer, hoveringAnnotationEl } = ctx;
      const [visibleMenu, setVisibleMenu] = useState<string | undefined>();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const editor = pdfViewer!.editor;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const annotationId = hoveringAnnotationEl!.dataset.annotationId!;
      const annotation = editor.getAnnotationById(annotationId);

      const handleRemove = useCallback(() => {
        editor.removeAnnotation(annotationId);

        runInAction(() => {
          ctx.hoveringAnnotationEl = null;
        });
      }, [annotationId, ctx, editor]);

      const handleColorSelect = useCallback(
        (color: HighlightColors) => {
          editor.updateAnnotation(annotationId, { annotation: { color } });
          runInAction(() => {
            ctx.hoveringAnnotationEl = null;
          });
        },
        [annotationId, ctx, editor],
      );

      const handleComment = useCallback(
        (v: string) => {
          editor.updateAnnotation(annotationId, { comment: v });
          runInAction(() => {
            ctx.hoveringAnnotationEl = null;
          });
        },
        [annotationId, ctx, editor],
      );

      return (
        <div ref={ref} style={style} className="z-10 rounded ">
          <div className="w-fit bg-gray-600 ">
            <Button
              className="text-white"
              type="text"
              icon={<BgColorsOutlined />}
              onClick={() => setVisibleMenu('colors')}
            />
            <Button
              className="text-white"
              type="text"
              icon={<CommentOutlined />}
              onClick={() => setVisibleMenu('comment')}
            />
            <Button className="text-white" type="text" icon={<DeleteOutlined />} onClick={handleRemove} />
          </div>
          {visibleMenu === 'colors' && <SelectionTooltip onSelect={handleColorSelect} />}
          {visibleMenu === 'comment' && (
            <CommentTextArea defaultValue={annotation?.comment} onConfirm={handleComment} />
          )}
        </div>
      );
    },
  ),
);
