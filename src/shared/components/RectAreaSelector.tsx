import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useMouse, useEventListener, useKeyPress, useMemoizedFn, useRafState } from 'ahooks';
import type { VirtualElement } from '@floating-ui/dom';

interface Props {
  target: HTMLElement;
  pressedKey?: string;
  className?: string;
  targetClassName?: string;
  onSelect: (pos: Rect) => void;
  onStart?: () => void;
  onStop?: () => void;
}

export interface Rect {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width: number;
  height: number;
}

export interface ReactAreaSelectorRef extends VirtualElement {
  stop: () => void;
  setRect: (cb: (pos: Rect | null) => Rect) => void;
}

const emptyClientRect = {
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export default forwardRef<ReactAreaSelectorRef, Props>(function RectAreaSelector(
  { target, pressedKey, className, targetClassName, onSelect, onStart, onStop },
  ref,
) {
  const { elementX, elementY, elementW, elementH } = useMouse(target);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useRafState<Rect | null>(null);
  const [isSelecting, setIsSelecting] = useState(!pressedKey || false);
  const rectRef = useRef<HTMLDivElement | null>(null);

  if (startPos) {
    setRect({
      [elementX > startPos.x ? 'left' : 'right']: elementX > startPos.x ? startPos.x : elementW - startPos.x,
      [elementY > startPos.y ? 'top' : 'bottom']: elementY > startPos.y ? startPos.y : elementH - startPos.y,
      width: Math.min(Math.abs(elementX - startPos.x), elementX > startPos.x ? elementW - startPos.x : startPos.x),
      height: Math.min(Math.abs(elementY - startPos.y), elementY > startPos.y ? elementH - startPos.y : startPos.y),
    });
  }

  if (!isSelecting && startPos) {
    setStartPos(null);
  }

  const start = () => {
    if (!isSelecting) {
      return;
    }

    setStartPos({ x: elementX, y: elementY });
    onStart?.();
  };

  const stop = useMemoizedFn((e?: MouseEvent) => {
    e?.preventDefault();
    setStartPos(null);
    setRect(null);
    onStop?.();
  });

  const select = () => {
    if (!rect) {
      return;
    }

    onSelect(rect);
    setIsSelecting(false);

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
  useEventListener('contextmenu', stop, { target });

  useKeyPress(pressedKey || '', () => setIsSelecting(true), { events: ['keydown'] });
  useKeyPress(pressedKey || '', () => setIsSelecting(false), { events: ['keyup'] });

  useImperativeHandle(
    ref,
    () => ({
      getBoundingClientRect: () => rectRef.current?.getBoundingClientRect() || emptyClientRect,
      setRect: (cb) => setRect(cb(rect)),
      stop,
    }),
    [rect, setRect, stop],
  );

  useEffect(() => {
    if (isSelecting && targetClassName) {
      const classes = targetClassName.split(/\s+/);
      target.classList.add(...classes);

      return () => target.classList.remove(...classes);
    }
  }, [isSelecting, target, targetClassName]);

  return rect ? <div ref={rectRef} className={className} style={{ ...rect, position: 'absolute' }}></div> : null;
});
