import { observer } from 'mobx-react-lite';
import { MouseEvent, useContext, useEffect, useRef } from 'react';
import clsx from 'clsx';

import type { AnnotationVO } from '@shared/domain/model/material';
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
    pdfViewer.editor.setCurrentAnnotationId(annotationId);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (!e.relatedTarget || !pdfViewer.annotationTooltipRoot?.contains(e.relatedTarget as HTMLElement)) {
      pdfViewer.editor.setCurrentAnnotationId(null);
    }
  };

  useEffect(() => {
    if (isLast) {
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
        'pointer-events-auto absolute cursor-pointer bg-clip-content opacity-30',
        annotationId === pdfViewer.editor.currentAnnotationId ? 'brightness-150' : null,
      )}
      style={{
        backgroundColor: color,
        borderBottom: annotationId === pdfViewer.editor.currentAnnotationId ? '10px solid transparent' : undefined,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
