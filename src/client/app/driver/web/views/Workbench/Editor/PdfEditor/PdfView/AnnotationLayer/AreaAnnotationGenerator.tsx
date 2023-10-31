import { useEffect, useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useFloating } from '@floating-ui/react';
import { useEventListener, useMemoizedFn } from 'ahooks';
import mapValues from 'lodash/mapValues';

import RectAreaSelector, { ReactAreaSelectorRef, type Rect } from 'components/RectAreaSelector';

import context from '../../Context';

export default observer(function AreaAnnotationGenerator({ page }: { page: number }) {
  const { pdfViewer } = useContext(context);
  const [rect, setRect] = useState<Rect | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectorRef = useRef<ReactAreaSelectorRef | null>(null);
  const { refs, floatingStyles, update } = useFloating();

  if (!pdfViewer) {
    throw new Error('no pdfViewer');
  }

  const pageEl = pdfViewer.getPageEl(page);
  const stop = useMemoizedFn(() => {
    setRect(null);
    selectorRef.current?.stop();
    pdfViewer?.rootEl.classList.remove('select-none');
  });

  const create = useMemoizedFn(async () => {
    if (!rect) {
      throw new Error('no pos');
    }

    const { height: displayHeight, width: displayWith } = pdfViewer.getSize(page);

    await pdfViewer.createAreaAnnotation(page, {
      width: rect.width,
      height: rect.height,
      x: typeof rect.left === 'number' ? rect.left : displayWith - rect.width - rect.right!,
      y: typeof rect.top === 'number' ? rect.top : displayHeight - rect.height - rect.bottom!,
    });
    stop();
  });

  const onStart = useMemoizedFn(() => {
    pdfViewer?.rootEl.classList.add('select-none');
  });

  useEventListener(
    'click',
    (e) => {
      if (!rootRef.current?.contains(e.target as HTMLElement)) {
        stop();
      }
    },
    { target: pdfViewer?.rootEl },
  );

  const setRefs = useMemoizedFn((ref: ReactAreaSelectorRef | null) => {
    refs.setReference(ref);
    selectorRef.current = ref;
  });

  useEffect(
    () =>
      reaction(
        () => pdfViewer.scale,
        (scale, oldScale) => {
          if (rect && selectorRef.current) {
            selectorRef.current.setRect((pos) => mapValues(pos, (v) => ((v as number) / oldScale) * scale));
          }
          update();
        },
      ),
    [pdfViewer, rect, update],
  );

  return (
    <div ref={rootRef} className="pointer-events-auto">
      <RectAreaSelector
        onStart={onStart}
        onSelect={setRect}
        pressedKey="shift"
        target={pageEl}
        ref={setRefs}
        className="bg-yellow-400 opacity-30"
      />
      {rect && (
        <button onClick={create} ref={refs.setFloating} style={floatingStyles}>
          Add Highlight
        </button>
      )}
    </div>
  );
});
