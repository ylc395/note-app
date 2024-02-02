import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { AiOutlineComment } from 'react-icons/ai';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';
import PageOverlay from './PageOverlay';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const { editor } = useContext(context);
  assert(editor.viewer instanceof PdfViewer);

  const rects = editor.viewer.annotationManager.getRectsOfPage(page);
  editor.viewer.scale.value; // read it to make it a reactive dependency

  return (
    <PageOverlay page={page}>
      {rects.map(({ color, withComment, ...rect }, i) => (
        <>
          <mark
            key={i}
            className="pointer-events-auto absolute cursor-pointer"
            style={{ backgroundColor: color, ...rect }}
          />
          {withComment && (
            <AiOutlineComment
              style={{ right: rect.right - 10, top: rect.top - 10 }}
              className="pointer-events-auto absolute cursor-pointer"
            />
          )}
          {withComment}
        </>
      ))}
    </PageOverlay>
  );
});
