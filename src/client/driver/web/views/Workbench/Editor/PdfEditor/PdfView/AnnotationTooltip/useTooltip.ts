import { useContext } from 'react';
import { useFloating, autoUpdate } from '@floating-ui/react';
import { useEventListener } from 'ahooks';

import context from '../../Context';

export default function useAnnotationTooltip() {
  const { pdfViewer } = useContext(context);

  const {
    floatingStyles: styles,
    refs: { setFloating, floating },
  } = useFloating({
    elements: { reference: pdfViewer?.currentAnnotationElement },
    whileElementsMounted: autoUpdate,
  });

  if (floating.current) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pdfViewer!.annotationTooltipRoot = floating.current;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  useEventListener('mouseleave', () => pdfViewer!.editorView.setCurrentAnnotationId(null), { target: floating });

  return { setFloating, showing: Boolean(pdfViewer?.editorView.currentAnnotationId), styles };
}
