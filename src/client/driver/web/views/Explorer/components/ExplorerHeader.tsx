import type { ReactNode } from 'react';
import Droppable from '@web/components/dnd/Droppable';

interface Props {
  children: ReactNode;
  title: string;
  onDrop?: (item: unknown) => void;
}

export default function ExplorerHeader({ children, title, onDrop }: Props) {
  return (
    <div className="relative mb-2 flex items-center justify-between">
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      {children}
      {onDrop && (
        <Droppable
          onDrop={onDrop}
          className="absolute inset-0 flex items-center justify-center border border-dashed bg-gray-50 text-gray-500"
        >
          拖拽至此处移至根目录
        </Droppable>
      )}
    </div>
  );
}
