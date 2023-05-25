import { useState, useRef, useCallback } from 'react';
import { useEventListener, useMouse, useRafState, useKeyPress, useClickAway } from 'ahooks';
import { usePopper } from 'react-popper';
import type PdfViewer from './PdfViewer';

interface Position {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width: number;
  height: number;
}

// eslint-disable-next-line mobx/missing-observer
export default function HighlightArea({
  page,
  pdfViewer,
  ratios,
}: {
  page: number;
  pdfViewer: PdfViewer;
  ratios: { vertical: number; horizontal: number };
}) {
  const textLayerEl = pdfViewer.getTextLayerEl(page);
  const { elementX, elementY, elementW, elementH } = useMouse(textLayerEl);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const [finalPos, setFinalPos] = useRafState<Position | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(areaRef.current, buttonRef.current);

  const stopDragging = useCallback(() => {
    setStartPos(null);
    textLayerEl?.classList.remove('select-none');
  }, [textLayerEl]);

  const startDragging = () => {
    if (!isKeyPressed) {
      return;
    }

    setFinalPos(null);
    setStartPos({ x: elementX, y: elementY });
    textLayerEl?.classList.add('select-none');
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

  useEventListener('mousedown', startDragging, { target: textLayerEl });
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

    const { height: displayHeight, width: displayWith } = pdfViewer.getSize(page);

    pdfViewer.createHighlightArea(page, {
      width: finalPos.width * ratios.horizontal,
      height: finalPos.height * ratios.vertical,
      x:
        typeof finalPos.left === 'number'
          ? finalPos.left * ratios.horizontal
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (displayWith - finalPos.width - finalPos.right!) * ratios.horizontal,
      y:
        typeof finalPos.top === 'number'
          ? finalPos.top * ratios.vertical
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (displayHeight - finalPos.height - finalPos.bottom!) * ratios.vertical,
    });
  };

  if (pos) {
    setFinalPos(pos);
  }

  return finalPos ? (
    <div ref={rootRef}>
      <div ref={areaRef} className="absolute bg-yellow-400" style={finalPos}></div>
      {finalPos && !startPos && (
        <div onClick={create} ref={buttonRef} style={styles.popper} {...attributes.popper}>
          Add Highlight
        </div>
      )}
    </div>
  ) : null;
}
