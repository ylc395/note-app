import type { ReactNode } from 'react';
import Droppable from '@web/components/dnd/Droppable';
import Button from '@web/components/Button';

interface Props {
  title: string;
  left: { icon: ReactNode; onClick: () => void }[];
  right: { icon: ReactNode; onClick: () => void; disabled?: boolean }[];
  onDrop?: (item: unknown) => void;
}

// eslint-disable-next-line mobx/missing-observer
export default function ExplorerHeader({ title, onDrop, left, right }: Props) {
  return (
    <div className="relative mb-2 flex items-center justify-between">
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      <div className="flex grow justify-between">
        <div className="flex">
          {left.map(({ onClick, icon }, i) => (
            <Button onClick={() => onClick()} key={i}>
              {icon}
            </Button>
          ))}
        </div>
        <div className="flex">
          {right.map(({ onClick, icon, disabled }, i) => (
            <Button onClick={() => onClick()} key={i} disabled={disabled}>
              {icon}
            </Button>
          ))}
        </div>
      </div>
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
