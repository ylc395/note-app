import { observer } from 'mobx-react-lite';
import { MouseEvent, useContext, useEffect, useRef } from 'react';
import clsx from 'clsx';

import type { AnnotationVO } from 'interface/material';
import context from '../../Context';

export default observer(function Annotation({
  page,
  rect,
  color,
  annotationId,
  isLast,
}: {
  rect: { x: number; y: number; height: number; width: number };
  color: string;
  annotationId: AnnotationVO['id'];
  page: number;
  isLast: boolean;
}) {
  const { pdfViewer } = useContext(context);

  if (!pdfViewer) {
    throw new Error('no pdfViewer');
  }

  const rootRef = useRef<HTMLElement | null>(null);
  const { horizontalRatio, verticalRatio } = pdfViewer.getPageRatio(page);
  const handleMouseOver = () => {
    pdfViewer.editorView.setCurrentAnnotationId(annotationId);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (!e.relatedTarget || !pdfViewer.annotationTooltipRoot?.contains(e.relatedTarget as HTMLElement)) {
      pdfViewer.editorView.setCurrentAnnotationId(annotationId);
    }
  };

  useEffect(() => {
    if (isLast) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      pdfViewer.referenceElMap[annotationId] = rootRef.current!;
      return () => {
        delete pdfViewer.referenceElMap[annotationId];
      };
    }
  }, [annotationId, pdfViewer, isLast]);

  return (
    <mark
      ref={rootRef}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'pointer-events-auto absolute z-30 cursor-pointer bg-clip-content opacity-30',
        annotationId === pdfViewer.editorView.currentAnnotationId ? 'brightness-150' : null,
      )}
      style={{
        backgroundColor: color,
        borderBottom: annotationId === pdfViewer.editorView.currentAnnotationId ? '10px solid transparent' : undefined,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
