import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import clsx from 'clsx';

import type { AnnotationVO } from 'interface/material';
import { BUFFER } from './constants';
import context from '../../Context';

export default observer(function HighlightFragment({
  page,
  fragment: { rect, color, annotationId },
}: {
  fragment: {
    rect: { x: number; y: number; height: number; width: number };
    color: string;
    annotationId: AnnotationVO['id'];
  };
  page: number;
}) {
  const ctx = useContext(context);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { horizontalRatio, verticalRatio } = ctx.pdfViewer!.getPageRatio(page);

  return (
    <mark
      className={clsx(
        'absolute z-30 cursor-pointer bg-clip-content opacity-30',
        annotationId === ctx.hoveringAnnotationId ? 'brightness-150' : null,
      )}
      data-annotation-id={annotationId}
      style={{
        borderBottom: annotationId === ctx.hoveringAnnotationId ? `solid transparent ${BUFFER}px` : 0,
        backgroundColor: color,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
