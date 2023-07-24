import { useEffect, useCallback, useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useFloating } from '@floating-ui/react';
import { useEventListener } from 'ahooks';
import mapValues from 'lodash/mapValues';

import RectAreaSelector, { ReactAreaSelectorRef, type Position } from 'components/RectAreaSelector';

import context from '../../Context';

export default observer(function AreaAnnotationGenerator({ page }: { page: number }) {
  const { pdfViewer } = useContext(context);
  const [pos, setPos] = useState<Position | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectorRef = useRef<ReactAreaSelectorRef | null>(null);
  const pageEl = pdfViewer?.getPageEl(page);

  if (!pageEl) {
    throw new Error('no page el');
  }

  const { refs, floatingStyles, update } = useFloating();
  const stop = useCallback(() => {
    setPos(null);
    selectorRef.current?.stop();
    pdfViewer?.rootEl.classList.remove('select-none');
  }, [pdfViewer]);

  const create = useCallback(async () => {
    if (!pos) {
      throw new Error('no pos');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { height: displayHeight, width: displayWith } = pdfViewer!.getSize(page);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await pdfViewer!.createAreaAnnotation(page, {
      width: pos.width,
      height: pos.height,
      x:
        typeof pos.left === 'number'
          ? pos.left
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            displayWith - pos.width - pos.right!,
      y:
        typeof pos.top === 'number'
          ? pos.top
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            displayHeight - pos.height - pos.bottom!,
    });
    stop();
  }, [page, pdfViewer, pos, stop]);

  const onStart = useCallback(() => {
    pdfViewer?.rootEl.classList.add('select-none');
  }, [pdfViewer]);

  useEventListener(
    'click',
    (e) => {
      if (!rootRef.current?.contains(e.target as HTMLElement)) {
        stop();
      }
    },
    { target: pdfViewer?.rootEl },
  );

  const setRefs = useCallback(
    (ref: ReactAreaSelectorRef | null) => {
      refs.setReference(ref);
      selectorRef.current = ref;
    },
    [refs],
  );

  useEffect(
    () =>
      reaction(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        () => pdfViewer!.scale,
        (scale, oldScale) => {
          if (pos && selectorRef.current) {
            selectorRef.current.setFinalPos((pos) => mapValues(pos, (v) => ((v as number) / oldScale) * scale));
          }
          update();
        },
      ),
    [pdfViewer, pos, update],
  );

  return (
    <div ref={rootRef} className="pointer-events-auto">
      <RectAreaSelector
        onStart={onStart}
        onSelect={setPos}
        pressedKey="shift"
        target={pageEl}
        ref={setRefs}
        className="absolute bg-yellow-400 opacity-30"
      />
      {pos && (
        <button onClick={create} ref={refs.setFloating} style={floatingStyles}>
          Add Highlight
        </button>
      )}
    </div>
  );
});
