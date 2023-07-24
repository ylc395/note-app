import { useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useMouse, useEventListener, useKeyPress } from 'ahooks';
import type { VirtualElement } from '@floating-ui/dom';

interface Props {
  target: HTMLElement;
  pressedKey?: string;
  className: string;
  onSelect: (pos: Position) => void;
  onStart?: () => void;
}

export interface Position {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width: number;
  height: number;
}

export interface ReactAreaSelectorRef extends VirtualElement {
  stop: () => void;
}

export default forwardRef<ReactAreaSelectorRef, Props>(function RectAreaSelector(
  { target, pressedKey, className, onSelect, onStart },
  ref,
) {
  const { elementX, elementY, elementW, elementH } = useMouse(target);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [final, setFinal] = useState<Position | null>(null);
  const [isKeyPressed, setIsKeyPressed] = useState(!pressedKey || false);
  const rectRef = useRef<HTMLDivElement | null>(null);

  if (!isKeyPressed && startPos) {
    setStartPos(null);
  }

  const pos =
    final ||
    (startPos
      ? {
          [elementX > startPos.x ? 'left' : 'right']: elementX > startPos.x ? startPos.x : elementW - startPos.x,
          [elementY > startPos.y ? 'top' : 'bottom']: elementY > startPos.y ? startPos.y : elementH - startPos.y,
          width: Math.min(Math.abs(elementX - startPos.x), elementX > startPos.x ? elementW - startPos.x : startPos.x),
          height: Math.min(Math.abs(elementY - startPos.y), elementY > startPos.y ? elementH - startPos.y : startPos.y),
        }
      : null);

  const start = () => {
    if (!isKeyPressed) {
      return;
    }

    setStartPos({ x: elementX, y: elementY });
    onStart?.();
  };

  const stop = useCallback(() => {
    setStartPos(null);
    setFinal(null);
  }, []);

  const select = () => {
    if (!pos || final) {
      return;
    }

    onSelect(pos);
    setFinal(pos);

    // prevent click event after mouseup event
    window.addEventListener(
      'click',
      function handleClick(e) {
        e.stopPropagation();
        window.removeEventListener('click', handleClick, true);
      },
      true,
    );
  };

  useEventListener('mousedown', start, { target });
  useEventListener('mouseup', select);

  useKeyPress(pressedKey || '', () => setIsKeyPressed(true), { events: ['keydown'] });
  useKeyPress(pressedKey || '', () => setIsKeyPressed(false), { events: ['keyup'] });

  useImperativeHandle(
    ref,
    () => {
      return {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        getBoundingClientRect: () => rectRef.current!.getBoundingClientRect(),
        stop,
      };
    },
    [stop],
  );

  return pos ? <div ref={rectRef} className={className} style={pos}></div> : null;
});
