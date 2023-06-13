import { Button } from 'antd';
import { useState, useContext, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { BgColorsOutlined, CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import { action } from 'mobx';

import context from '../../Context';
import Palette from './Palette';
import CommentTextArea from './CommentTextArea';
import useTooltip from './useTooltip';

export default observer(function AnnotationTooltip() {
  const ctx = useContext(context);
  const { pdfViewer, targetAnnotationId } = ctx;
  const [visibleMenu, setVisibleMenu] = useState<string | undefined>();
  const editor = pdfViewer?.editor;
  const annotation = targetAnnotationId ? editor?.getAnnotationById(targetAnnotationId) : undefined;

  useEffect(() => {
    setVisibleMenu(undefined);
  }, [targetAnnotationId]);

  const { setFloating, styles, showing } = useTooltip();
  const handleRemove = action(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor!.removeAnnotation(targetAnnotationId!);
    ctx.targetAnnotationId = null;
  });

  const handleColorSelect = action((color: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor!.updateAnnotation(targetAnnotationId!, { color });
    ctx.targetAnnotationId = null;
  });

  const handleComment = (v: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editor!.updateAnnotation(targetAnnotationId!, { comment: v });
    ctx.targetAnnotationId = null;
  };

  return showing ? (
    <div ref={setFloating} style={styles} className="z-10 rounded">
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
      {visibleMenu === 'comment' && <CommentTextArea defaultValue={annotation?.comment} onConfirm={handleComment} />}
    </div>
  ) : null;
});
