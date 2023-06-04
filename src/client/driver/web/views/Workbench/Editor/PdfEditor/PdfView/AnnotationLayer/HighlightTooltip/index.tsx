import { Button } from 'antd';
import { useState, useContext, forwardRef, type CSSProperties, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import { runInAction } from 'mobx';

import type { HighlightColors } from 'model/material/PdfEditor';
import context from '../../../Context';
import Palette from './Palette';
import CommentTextArea from './CommentTextArea';

interface Props {
  style?: CSSProperties;
}

export default observer(
  forwardRef<HTMLDivElement | null, Props>(
    // eslint-disable-next-line mobx/missing-observer
    function HighlightTooltip({ style }, ref) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      const ctx = useContext(context);
      const { pdfViewer, hoveringAnnotationId: annotationId } = ctx;
      const [visibleMenu, setVisibleMenu] = useState<string | undefined>();
      const editor = pdfViewer!.editor;
      const annotation = editor.getAnnotationById(annotationId!);

      useEffect(() => {
        setVisibleMenu(undefined);
      }, [annotationId]);

      const handleRemove = useCallback(() => {
        editor.removeAnnotation(annotationId!);

        runInAction(() => {
          ctx.hoveringAnnotationId = null;
        });
      }, [annotationId, ctx, editor]);

      const handleColorSelect = useCallback(
        (color: HighlightColors) => {
          editor.updateAnnotation(annotationId!, { annotation: { color } });
          runInAction(() => {
            ctx.hoveringAnnotationId = null;
          });
        },
        [annotationId, ctx, editor],
      );

      const handleComment = useCallback(
        (v: string) => {
          editor.updateAnnotation(annotationId!, { comment: v });
          runInAction(() => {
            ctx.hoveringAnnotationId = null;
          });
        },
        [annotationId, ctx, editor],
      );
      /* eslint-enable @typescript-eslint/no-non-null-assertion */

      return (
        <div ref={ref} style={style} className="z-20 rounded">
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
          {visibleMenu === 'colors' && <Palette onSelect={handleColorSelect} />}
          {visibleMenu === 'comment' && <CommentTextArea defaultValue={annotation.comment} onConfirm={handleComment} />}
        </div>
      );
    },
  ),
);
