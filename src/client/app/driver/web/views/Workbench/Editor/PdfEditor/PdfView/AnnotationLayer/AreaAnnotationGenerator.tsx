import { useEffect, useCallback, useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useFloating } from '@floating-ui/react';
import { useEventListener } from 'ahooks';
import mapValues from 'lodash/mapValues';

import RectAreaSelector, {
  ReactAreaSelectorRef,
  type Rect,
} from '../../../../../../../../../shared/components/RectAreaSelector';

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

  if (!pageEl) {
    throw new Error('no page el');
  }
  const stop = useCallback(() => {
    setRect(null);
    selectorRef.current?.stop();
    pdfViewer?.rootEl.classList.remove('select-none');
  }, [pdfViewer]);

  const create = useCallback(async () => {
    if (!rect) {
      throw new Error('no pos');
    }

    const { height: displayHeight, width: displayWith } = pdfViewer.getSize(page);

    await pdfViewer.createAreaAnnotation(page, {
      width: rect.width,
      height: rect.height,
      x:
        typeof rect.left === 'number'
          ? rect.left
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            displayWith - rect.width - rect.right!,
      y:
        typeof rect.top === 'number'
          ? rect.top
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            displayHeight - rect.height - rect.bottom!,
    });
    stop();
  }, [page, pdfViewer, rect, stop]);

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
