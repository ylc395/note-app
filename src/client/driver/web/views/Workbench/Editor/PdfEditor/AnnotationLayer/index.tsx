import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import HighlightFragment from './HighlightFragment';
import HighlightArea from './HighlightArea';
import DraggingHighlightArea from './DraggingHighlightArea';

import context from '../Context';

export default observer(function AnnotationLayer({ page }: { page: number }) {
  const { pdfViewer } = useContext(context);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const textLayerEl = pdfViewer!.getTextLayerEl(page);

  if (!textLayerEl) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fragments = pdfViewer!.editor.highlightFragmentsByPage[page] || [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const areas = pdfViewer!.editor.highlightAreasByPage[page] || [];

  return createPortal(
    <div>
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
