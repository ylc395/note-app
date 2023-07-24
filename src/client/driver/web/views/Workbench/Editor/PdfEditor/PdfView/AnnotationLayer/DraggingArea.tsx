import { useCallback, useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useFloating } from '@floating-ui/react';
import { useEventListener } from 'ahooks';

import RectAreaSelector, { type Position, type ReactAreaSelectorRef } from 'components/RectAreaSelector';

import context from '../../Context';

export default observer(function DraggingArea({ page }: { page: number }) {
  const { pdfViewer } = useContext(context);
  const [pos, setPos] = useState<Position | undefined>();
  const selectorRef = useRef<ReactAreaSelectorRef | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pageEl = pdfViewer?.getPageEl(page);

  if (!pageEl) {
    throw new Error('no page el');
  }

  const { refs, floatingStyles } = useFloating();
  const stop = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    selectorRef.current!.stop();
    setPos(undefined);
    pageEl.classList.remove('select-none');
  }, [pageEl]);

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
    pageEl.classList.add('select-none');
  }, [pageEl]);

  const setRef = useCallback(
    (ref: ReactAreaSelectorRef | null) => {
      selectorRef.current = ref;
      refs.setReference(ref);
    },
    [refs],
  );

  useEventListener(
    'click',
    (e) => {
      if (!rootRef.current?.contains(e.target as HTMLElement)) {
        stop();
      }
    },
    { target: pdfViewer?.rootEl },
  );

  return (
    <div ref={rootRef} className="pointer-events-auto">
      <RectAreaSelector
        onStart={onStart}
        onSelect={setPos}
        pressedKey="shift"
        target={pageEl}
        ref={setRef}
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
