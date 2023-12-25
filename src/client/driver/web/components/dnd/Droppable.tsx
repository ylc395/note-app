import { useEffect, type ReactNode, useState } from 'react';
import { useDrop } from 'react-dnd';

interface Props {
  children: ReactNode;
  className?: string;
  onDrop: (item: unknown) => void;
  onDragMove?: (e: { cursor: { x: number; y: number }; dropRect: DOMRect }) => void;
  onOverToggle?: (isOver: boolean) => void;
}

export default function Droppable({ children, onOverToggle, onDrop, onDragMove, ...props }: Props) {
  const [divEl, setDivEl] = useState<HTMLElement | null>(null);
  const [{ isOver, cursor }, dropRef] = useDrop(
    {
      accept: 'any',
      drop: (item, monitor) => {
        !monitor.didDrop() && onDrop(item);
        return; // always return undefined
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        cursor: monitor.getClientOffset(),
        item: monitor.getItem(),
      }),
    },
    [onDrop],
  );

  const handleMouseMove = () => {
    if (isOver && divEl && cursor) {
      onDragMove?.({ cursor, dropRect: divEl.getBoundingClientRect() });
    }
  };

  useEffect(() => {
    onOverToggle?.(isOver);
  }, [isOver, onOverToggle]);

  return (
    <div
      {...props}
      ref={(el) => {
        setDivEl(el);
        dropRef(el);
      }}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}
