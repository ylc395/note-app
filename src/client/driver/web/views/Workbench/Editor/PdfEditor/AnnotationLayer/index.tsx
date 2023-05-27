import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';
import { useEventListener } from 'ahooks';
import { action } from 'mobx';

import HighlightFragment from './HighlightFragment';
import HighlightArea from './HighlightArea';
import DraggingHighlightArea from './DraggingHighlightArea';

import context from '../Context';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const ctx = useContext(context);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const textLayerEl = ctx.pdfViewer!.getTextLayerEl(page);

  useEventListener(
    'mouseover',
    action((e: MouseEvent) => {
      if (!(e.target as HTMLElement).dataset.annotationId) {
        return;
      }

      ctx.hoveringAnnotationEl = e.target as HTMLElement;
    }),
    { target: rootRef },
  );

  if (!textLayerEl) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fragments = ctx.pdfViewer!.editor.highlightFragmentsByPage[page] || [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const areas = ctx.pdfViewer!.editor.highlightAreasByPage[page] || [];

  return createPortal(
    <div ref={rootRef}>
      {fragments.map((fragment) => (
        <HighlightFragment
          key={fragment.highlightId}
          annotationId={fragment.annotationId}
          fragment={fragment}
          page={page}
        />
      ))}
      {areas.map((area) => (
        <HighlightArea key={area.id} area={area} page={page} />
      ))}
      <DraggingHighlightArea page={page} />
    </div>,
    textLayerEl,
  );
});
