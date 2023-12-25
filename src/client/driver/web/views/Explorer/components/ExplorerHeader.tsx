import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title: string;
  canDrop?: boolean;
}

export default function ExplorerHeader({ children, title, canDrop }: Props) {
  return (
    <div className="relative mb-2 flex items-center justify-between">
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      {children}
      {canDrop && (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed bg-gray-50 text-gray-500">
          拖拽至此处移至根目录
        </div>
      )}
    </div>
  );
}
