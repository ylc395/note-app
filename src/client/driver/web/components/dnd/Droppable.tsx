import { useEffect, type ReactNode, useRef } from 'react';
import { XYCoord, useDrop } from 'react-dnd';

import { useDragItem } from './hooks';

interface Props {
  children: ReactNode;
  className?: string;
  onDrop: (item: unknown) => void;
  onDragMove?: (e: { cursor: NonNullable<XYCoord>; dropRect: DOMRect }) => void;
  onOverToggle?: (isOver: boolean) => void;
}

export default function Droppable({ children, className, onOverToggle, onDragMove, onDrop }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [{ isOver }, dropRef] = useDrop(
    {
      accept: 'any',
      drop: (item, monitor) => {
        !monitor.didDrop() && onDrop(item);
        return; // always return undefined
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    },
    [onDrop],
  );

  const { position } = useDragItem();

  useEffect(() => {
    onOverToggle?.(isOver);
  }, [isOver, onOverToggle]);

  useEffect(() => {
    isOver && position && onDragMove?.({ cursor: position, dropRect: divRef.current!.getBoundingClientRect() });
  }, [position, onDragMove, isOver]);

  return dropRef(
    <div className={className} ref={divRef}>
      {children}
    </div>,
  );
}
