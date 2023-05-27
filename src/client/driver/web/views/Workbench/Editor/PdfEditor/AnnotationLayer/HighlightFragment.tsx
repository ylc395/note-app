import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';
import clsx from 'clsx';

import type { AnnotationVO } from 'interface/material';
import context from '../Context';

export default observer(function HighlightFragment({
  page,
  fragment: { rect, color },
  annotationId,
}: {
  fragment: {
    rect: { x: number; y: number; height: number; width: number };
    color: string;
  };
  page: number;
  annotationId: AnnotationVO['id'];
}) {
  const ctx = useContext(context);
  const markRef = useRef<HTMLElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { horizontalRatio, verticalRatio } = ctx.pdfViewer!.getPageRatio(page);

  return (
    <mark
      ref={markRef}
      className={clsx(
        'absolute z-10 cursor-pointer bg-clip-content opacity-30',
        annotationId === ctx.hoveringAnnotationId ? 'brightness-150' : null,
      )}
      data-annotation-id={annotationId}
      style={{
        borderBottom: annotationId === ctx.hoveringAnnotationId ? 'solid transparent 20px' : 0,
        backgroundColor: color,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
