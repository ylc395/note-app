import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { useFloating, offset, size, autoUpdate } from '@floating-ui/react';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';

export default observer(function AnnotationLayer({ pageEl, page }: { pageEl: HTMLElement; page: number }) {
  const { editor } = useContext(context);
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

  assert(editor.viewer instanceof PdfViewer);

  const rects = editor.viewer.annotationManager.getRectsOfPage(page);

  return (
    <div ref={setFloating} style={styles} className="pointer-events-none z-10 opacity-30">
      {rects.map(({ color, ...rect }, i) => (
        <mark
          key={i}
          className="pointer-events-auto absolute cursor-pointer"
          style={{ backgroundColor: color, ...rect }}
        />
      ))}
    </div>
  );
});
