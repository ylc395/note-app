import { observer } from 'mobx-react-lite';
import { type ReactNode, useContext } from 'react';
import { useFloating, offset, size, autoUpdate } from '@floating-ui/react';
import assert from 'assert';

import context from '../../Context';
import PdfViewer from '../../PdfViewer';

export default observer(function PageOverlay({ page, children }: { page: number; children: ReactNode }) {
  const { editor } = useContext(context);
  assert(editor.viewer instanceof PdfViewer);

  const pageEl = editor.viewer.getPageEl(page);
  const scale = getComputedStyle(pageEl).getPropertyValue('--scale-factor'); // set by pdf.js
  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    whileElementsMounted: autoUpdate, // handle viewer resize
    middleware: [
      offset(({ rects }) => {
        return -rects.reference.height / 2 - rects.floating.height / 2;
      }),
      size({
        apply: ({ rects, elements: { floating } }) => {
          Object.assign(floating.style, {
            width: `${rects.reference.width}px`,
            height: `${rects.reference.height}px`,
          });
        },
      }),
    ],
    elements: { reference: pageEl },
  });

  const style = {
    ...styles,
    '--scale-factor': scale,
  };

  return (
    <div ref={setFloating} style={style} className="pointer-events-none z-10 ">
      {children}
    </div>
  );
});
