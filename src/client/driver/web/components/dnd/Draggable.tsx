import { useEffect, type ReactNode, useRef, useLayoutEffect } from 'react';
import { useDrag, useDragLayer } from 'react-dnd';
import { createPortal } from 'react-dom';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface Props {
  children: ReactNode;
  item: unknown;
  className?: string;
  noPreview?: boolean;
  onDragEnd?: () => void;
  onDragCancel?: () => void;
  onDragStart?: () => void;
}

export default function Draggable({
  item,
  onDragEnd,
  onDragStart,
  onDragCancel,
  noPreview,
  children,
  className,
}: Props) {
  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: 'any',
      item,
      end: (_, monitor) => (monitor.didDrop() ? onDragEnd?.() : onDragCancel?.()),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [onDragEnd, item],
  );

  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    }
  }, [onDragStart, isDragging]);

  useEffect(() => {
    if (noPreview) {
      dragPreview(getEmptyImage(), { captureDraggingState: true });
    }
  }, [noPreview, dragPreview]);

  return (
    <div ref={drag} className={className}>
      {children}
    </div>
  );
}
