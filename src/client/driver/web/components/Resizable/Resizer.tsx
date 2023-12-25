import { useState, useRef, useEffect, forwardRef, type MouseEventHandler, type CSSProperties } from 'react';
import clsx from 'clsx';

export interface Props {
  onResize: (e: MouseEvent) => void;
  direction: 'x' | 'y';
  className?: string;
  style?: CSSProperties;
}

export default forwardRef<HTMLDivElement, Props>(function Resizer({ onResize, direction, style, className }, ref) {
  const [isResizing, setIsResizing] = useState(false);
  const maskRef = useRef<HTMLDivElement>(null);

  const onMouseDown: MouseEventHandler = (e) => {
    if (e.button !== 0) {
      return;
    }

    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const maskEl = maskRef.current;

    if (!maskEl) {
      return;
    }

    const onMousemove = (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      e.preventDefault();
      onResize(e);
    };

    const onMouseUp = () => {
      maskEl.classList.remove(direction === 'y' ? 'cursor-row-resize' : 'cursor-col-resize');
      setIsResizing(false);
    };

    maskEl.addEventListener('mousemove', onMousemove);
    maskEl.addEventListener('mouseup', onMouseUp);
    maskEl.classList.add(direction === 'y' ? 'cursor-row-resize' : 'cursor-col-resize');

    return () => {
      maskEl.removeEventListener('mousemove', onMousemove);
      maskEl.removeEventListener('mouseup', onMouseUp);
    };
  }, [direction, isResizing, onResize]);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      className={clsx(
        'bg-gray-100 hover:bg-blue-100',
        direction === 'y' ? 'h-[2px] cursor-row-resize hover:h-1' : 'w-[2px] cursor-col-resize hover:w-1',
        className,
      )}
      style={style}
    >
      {isResizing && <div ref={maskRef} className="fixed inset-0 z-50"></div>}
    </div>
  );
});
