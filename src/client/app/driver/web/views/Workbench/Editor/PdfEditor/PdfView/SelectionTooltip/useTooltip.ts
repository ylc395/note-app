import { useContext, useEffect, useState } from 'react';
import { useFloating, offset, autoUpdate } from '@floating-ui/react';

import Context from '../../Context';

export default function useSelectionTooltip() {
  const { pdfViewer } = useContext(Context);
  const [open, setOpen] = useState(false);

  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    elements: { reference: pdfViewer?.selection?.el },
    placement: pdfViewer?.selection?.collapseToStart ? 'top' : 'bottom',
    middleware: [offset(10)],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    setOpen(Boolean(pdfViewer?.selection));
  }, [pdfViewer?.selection]);

  return {
    setFloating,
    styles,
    open,
  };
}
