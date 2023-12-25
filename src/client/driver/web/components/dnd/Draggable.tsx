import { type ReactElement, useEffect, useMemo, type ReactNode } from 'react';
import { useDrag } from 'react-dnd';

interface Props {
  children: ReactNode;
  item: unknown;
  className?: string;
  customPreview?: () => ReactElement;
  onDragEnd?: () => void;
  onDragCancel?: () => void;
  onDragStart?: () => void;
}

export default function Draggable({
  item,
  onDragEnd,
  onDragStart,
  onDragCancel,
  customPreview,
  children,
  ...props
}: Props) {
  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: 'any',
      item,
      end: (_, monitor) => (monitor.didDrop() ? onDragEnd?.() : onDragCancel?.()),
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [onDragEnd, item],
  );

  const previewContent = useMemo(() => customPreview && customPreview(), [customPreview]);

  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    }
  }, [onDragStart, isDragging]);

  return (
    <>
      <div ref={drag} {...props}>
        {!previewContent ? <div ref={dragPreview}>{children}</div> : children}
      </div>
      {previewContent && dragPreview(previewContent)}
    </>
  );
}
