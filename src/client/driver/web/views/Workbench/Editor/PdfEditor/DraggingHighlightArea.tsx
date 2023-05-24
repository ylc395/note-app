import { useState, useRef, useCallback } from 'react';
import { useEventListener, useMouse, useRafState, useKeyPress, useClickAway } from 'ahooks';
import { usePopper } from 'react-popper';
import type PdfViewer from './PdfViewer';
import type { HighlightAreaDTO } from 'interface/material';

// eslint-disable-next-line mobx/missing-observer
export default function HighlightArea({ page, pdfViewer }: { page: number; pdfViewer: PdfViewer }) {
  const textLayerEl = pdfViewer.getTextLayerEl(page);
  const { elementX, elementY, elementW, elementH } = useMouse(textLayerEl);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isKeyPressed, setIsKeyPressed] = useState(false);
  const [finalPos, setFinalPos] = useRafState<HighlightAreaDTO['rect'] | null>(null);
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

  if (pos) {
    setFinalPos(pos);
  }

  return finalPos ? (
    <div ref={rootRef}>
      <div ref={areaRef} className="absolute bg-yellow-400" style={finalPos}></div>
      {finalPos && !startPos && (
        <div
          onClick={() => pdfViewer.createHighlightArea(page, finalPos)}
          ref={buttonRef}
          style={styles.popper}
          {...attributes.popper}
        >
          Add Highlight
        </div>
      )}
    </div>
  ) : null;
}
