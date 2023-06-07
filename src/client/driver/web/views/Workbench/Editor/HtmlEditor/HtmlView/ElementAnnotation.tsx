import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { useFloating, autoUpdate } from '@floating-ui/react';

import type { HtmlElementAnnotationVO } from 'interface/material';
import { floatingOptions } from '../../common/ElementSelector';
import ctx from '../Context';

export default observer(function ElementAnnotation({ el }: { el: HtmlElementAnnotationVO }) {
  const { htmlViewer } = useContext(ctx);
  const targetEl = htmlViewer?.rootEl.querySelector(el.selector);

  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    elements: { reference: targetEl },
    whileElementsMounted: autoUpdate,
    ...floatingOptions,
  });

  if (!targetEl) {
    return null;
  }

  return (
    <div
      ref={setFloating}
      style={{ ...styles, backgroundColor: el.color }}
      className="pointer-events-none opacity-10"
    ></div>
  );
});
