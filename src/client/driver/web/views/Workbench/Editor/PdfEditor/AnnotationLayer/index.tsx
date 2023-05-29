import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';
import { useEventListener } from 'ahooks';
import { action } from 'mobx';

import HighlightFragment from './HighlightFragment';
import HighlightArea from './HighlightArea';
import DraggingHighlightArea from './DraggingHighlightArea';
import HighlightTooltip from './HighlightTooltip';

import context from '../Context';
import useHighlightTooltip from './HighlightTooltip/useHighlightTooltip';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const ctx = useContext(context);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pageEl = ctx.pdfViewer!.getPageEl(page);

  const {
    setFloating: setHighlightTooltipPopper,
    styles: highlightTooltipStyles,
    showing: highlightTooltipShowing,
  } = useHighlightTooltip(page);

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
  const fragments = ctx.pdfViewer!.editor.highlightFragmentsByPage[page] || [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const areas = ctx.pdfViewer!.editor.highlightAreasByPage[page] || [];

  return createPortal(
    <div ref={rootRef}>
      {fragments.map((fragment) => (
        <HighlightFragment key={fragment.highlightId} fragment={fragment} page={page} />
      ))}
      {areas.map((area) => (
        <HighlightArea key={area.id} area={area} page={page} />
      ))}
      <DraggingHighlightArea page={page} />
      {highlightTooltipShowing && <HighlightTooltip ref={setHighlightTooltipPopper} style={highlightTooltipStyles} />}
    </div>,
    pageEl,
  );
});
