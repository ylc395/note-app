import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { useFloating, autoUpdate } from '@floating-ui/react';

import type { HtmlElementAnnotationVO } from 'interface/material';
import { coverElementMiddleware } from '../../common/floatingMiddleware';
import ctx from '../Context';

export default observer(function ElementAnnotation({ el }: { el: HtmlElementAnnotationVO }) {
  const { htmlViewer } = useContext(ctx);
  const targetEl = htmlViewer?.shadowRoot.querySelector(el.selector);

  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    elements: { reference: targetEl },
    whileElementsMounted: autoUpdate,
    middleware: coverElementMiddleware,
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
