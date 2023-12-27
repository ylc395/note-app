import { useEffect, type ReactNode } from 'react';
import { useDrop } from 'react-dnd';

interface Props {
  children: ReactNode;
  className?: string;
  onDrop: (item: unknown) => void;
  onOverToggle?: (isOver: boolean) => void;
}

export default function Droppable({ children, className, onOverToggle, onDrop }: Props) {
  const [{ isOver }, dropRef] = useDrop(
    {
      accept: 'any',
      drop: (item, monitor) => {
        !monitor.didDrop() && onDrop(item);
        return; // always return undefined
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        item: monitor.getItem(),
      }),
    },
    [onDrop],
  );

  useEffect(() => {
    onOverToggle?.(isOver);
  }, [isOver, onOverToggle]);

  return (
    <div className={className} ref={dropRef}>
      {children}
    </div>
  );
}
