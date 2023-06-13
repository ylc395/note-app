import { useContext } from 'react';
import { useFloating, autoUpdate } from '@floating-ui/react';
import { useEventListener } from 'ahooks';

import context from '../../Context';

export default function useAnnotationTooltip() {
  const ctx = useContext(context);
  const { referenceElMap, targetAnnotationId } = ctx;

  const {
    floatingStyles: styles,
    refs: { setFloating, floating },
  } = useFloating({
    elements: { reference: targetAnnotationId ? referenceElMap[targetAnnotationId] : null },
    whileElementsMounted: autoUpdate,
  });

  if (floating.current) {
    ctx.annotationTooltipRoot = floating.current;
  }

  useEventListener('mouseleave', () => (ctx.targetAnnotationId = null), { target: floating });

  return { setFloating, showing: Boolean(targetAnnotationId), styles };
}
