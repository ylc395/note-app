import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';
import { useEventListener } from 'ahooks';
import { action } from 'mobx';

import FragmentAnnotation from './FragmentAnnotation';
import AreaAnnotation from './AreaAnnotation';
import DraggingArea from './DraggingArea';
import AnnotationTooltip from './AnnotationTooltip';

import context from '../../Context';
import useTooltip from './AnnotationTooltip/useTooltip';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const ctx = useContext(context);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pageEl = ctx.pdfViewer!.getPageEl(page);

  const { setFloating: setTooltipPopper, styles: tooltipStyles, showing: tooltipShowing } = useTooltip(page);

  useEventListener(
    'mouseover',
    action((e: MouseEvent) => {
      const annotationId = (e.target as HTMLElement).dataset.annotationId;

      if (annotationId) {
        ctx.hoveringAnnotationId = annotationId;
      }
    }),
    { target: rootRef },
  );

  useEventListener(
    'mouseleave',
    action(() => {
      ctx.hoveringAnnotationId = null;
    }),
    { target: rootRef },
  );

  if (!pageEl) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fragments = ctx.pdfViewer!.editor.fragmentsByPage[page] || [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const areas = ctx.pdfViewer!.editor.areaAnnotationsByPage[page] || [];

  return createPortal(
    <div ref={rootRef}>
      {fragments.map((fragment) => (
        <FragmentAnnotation key={fragment.fragmentId} fragment={fragment} page={page} />
      ))}
      {areas.map((area) => (
        <AreaAnnotation key={area.id} area={area} page={page} />
      ))}
      <DraggingArea page={page} />
      {tooltipShowing && <AnnotationTooltip ref={setTooltipPopper} style={tooltipStyles} />}
    </div>,
    pageEl,
  );
});
