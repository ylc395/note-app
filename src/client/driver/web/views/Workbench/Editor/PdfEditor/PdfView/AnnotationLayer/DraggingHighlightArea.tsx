import { useState, useRef, useCallback, useContext } from 'react';
import { useEventListener, useMouse, useRafState, useKeyPress, useClickAway } from 'ahooks';
import { observer } from 'mobx-react-lite';
import { useFloating } from '@floating-ui/react';

import context from '../../Context';

interface Position {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width: number;
  height: number;
}

export default observer(function HighlightArea({ page }: { page: number }) {
  const { pdfViewer } = useContext(context);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pageEl = pdfViewer!.getPageEl(page);
  const { elementX, elementY, elementW, elementH } = useMouse(pageEl);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const [finalPos, setFinalPos] = useRafState<Position | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { refs, floatingStyles } = useFloating();

  const stopDragging = useCallback(() => {
    setStartPos(null);
    pageEl?.classList.remove('select-none');
  }, [pageEl]);

  const startDragging = () => {
    if (!isKeyPressed) {
      return;
    }

    setFinalPos(null);
    setStartPos({ x: elementX, y: elementY });
    pageEl?.classList.add('select-none');
  };

  useKeyPress('shift', () => setIsKeyPressed(true), { events: ['keydown'] });
  useKeyPress(
    'shift',
    () => {
      setIsKeyPressed(false);
      stopDragging();
    },
    { events: ['keyup'] },
  );

  useEventListener('mousedown', startDragging, { target: pageEl });
  useEventListener('mouseup', stopDragging);
  useClickAway(() => {
    if (!startPos && finalPos && !isKeyPressed) {
      setFinalPos(null);
    }
  }, rootRef);

  const pos = startPos
    ? {
        [elementX > startPos.x ? 'left' : 'right']: elementX > startPos.x ? startPos.x : elementW - startPos.x,
        [elementY > startPos.y ? 'top' : 'bottom']: elementY > startPos.y ? startPos.y : elementH - startPos.y,
        width: Math.abs(elementX - startPos.x),
        height: Math.abs(elementY - startPos.y),
      }
    : null;

  const create = () => {
    if (!finalPos) {
      throw new Error('no canvas');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { height: displayHeight, width: displayWith } = pdfViewer!.getSize(page);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pdfViewer!.createAreaAnnotation(page, {
      width: finalPos.width,
      height: finalPos.height,
      x:
        typeof finalPos.left === 'number'
          ? finalPos.left
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            displayWith - finalPos.width - finalPos.right!,
      y:
        typeof finalPos.top === 'number'
          ? finalPos.top
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            displayHeight - finalPos.height - finalPos.bottom!,
    });
  };

  if (pos) {
    setFinalPos(pos);
  }

  return finalPos ? (
    <div ref={rootRef}>
      <div ref={refs.setReference} className="absolute bg-yellow-400 opacity-30" style={finalPos}></div>
      {finalPos && !startPos && (
        <div className="z-20" onClick={create} ref={refs.setFloating} style={floatingStyles}>
          Add Highlight
        </div>
      )}
    </div>
  ) : null;
});
