import { useCallback, useState } from 'react';
import { useFloating, offset, autoUpdate } from '@floating-ui/react';

export default function useSelectionTooltip() {
  const [selectionEnd, setSelectionEnd] = useState<{ el: HTMLElement; collapseToStart: boolean } | null>(null);

  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    elements: { reference: selectionEnd?.el },
    placement: selectionEnd?.collapseToStart ? 'top' : 'bottom',
    middleware: [offset(10)],
    whileElementsMounted: autoUpdate,
  });

  const hide = useCallback(() => setSelectionEnd(null), []);

  return { setFloating, styles, show: setSelectionEnd, hide, showing: Boolean(selectionEnd) };
}
