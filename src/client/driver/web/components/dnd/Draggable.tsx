import { useEffect, type ReactNode } from 'react';
import { useDrag } from 'react-dnd';
import { createPortal } from 'react-dom';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface Props {
  children: ReactNode;
  item: unknown;
  className?: string;
  renderPreview?: () => ReactNode;
  onDragEnd?: () => void;
  onDragCancel?: () => void;
  onDragStart?: () => void;
}

export default function Draggable({
  item,
  onDragEnd,
  onDragStart,
  onDragCancel,
  renderPreview,
  children,
  className,
}: Props) {
  const [{ isDragging, initialOffset, currentOffset }, drag, dragPreview] = useDrag(
    () => ({
      type: 'any',
      item,
      end: (_, monitor) => (monitor.didDrop() ? onDragEnd?.() : onDragCancel?.()),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
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
    if (renderPreview) {
      dragPreview(getEmptyImage(), { captureDraggingState: true });
    }
  }, [renderPreview, dragPreview]);

  return (
    <>
      <div ref={drag} className={className}>
        {children}
      </div>
      {renderPreview && isDragging && createPortal(<div>{renderPreview()}</div>, document.body)}
    </>
  );
}
