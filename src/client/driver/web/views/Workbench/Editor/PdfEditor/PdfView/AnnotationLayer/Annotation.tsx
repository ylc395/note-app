import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
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
  const ctx = useContext(context);
  const rootRef = useRef<HTMLElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { horizontalRatio, verticalRatio } = ctx.pdfViewer!.getPageRatio(page);
  const handleMouseOver = action(() => {
    ctx.targetAnnotationId = annotationId;
  });

  const handleMouseLeave = action((e: MouseEvent) => {
    if (!e.relatedTarget || !ctx.annotationTooltipRoot?.contains(e.relatedTarget as HTMLElement)) {
      ctx.targetAnnotationId = null;
    }
  });

  useEffect(() => {
    if (isLast) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ctx.referenceElMap[annotationId] = rootRef.current!;
      return () => {
        delete ctx.referenceElMap[annotationId];
      };
    }
  }, [annotationId, ctx.referenceElMap, isLast]);

  return (
    <mark
      ref={rootRef}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'pointer-events-auto absolute z-30 cursor-pointer bg-clip-content opacity-30',
        annotationId === ctx.targetAnnotationId ? 'brightness-150' : null,
      )}
      style={{
        backgroundColor: color,
        borderBottom: annotationId === ctx.targetAnnotationId ? '10px solid transparent' : undefined,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
