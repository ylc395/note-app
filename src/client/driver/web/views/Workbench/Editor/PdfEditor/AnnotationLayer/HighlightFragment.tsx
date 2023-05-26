import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { useContext, useRef } from 'react';
import { useHover } from 'ahooks';
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

  useHover(markRef, {
    onEnter: action(() => {
      ctx.hoveringAnnotation = {
        id: annotationId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        el: markRef.current!,
      };
    }),
    onLeave: action(() => (ctx.hoveringAnnotation = null)),
  });

  return (
    <mark
      ref={markRef}
      className={clsx(
        'absolute z-10 cursor-pointer',
        annotationId === ctx.hoveringAnnotation?.id ? 'brightness-150' : null,
      )}
      style={{
        backgroundColor: color,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
