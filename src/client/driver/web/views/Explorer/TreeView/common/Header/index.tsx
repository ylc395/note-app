import Droppable from '@web/components/dnd/Droppable';
import Button, { type Props as ButtonProps } from './Button';

interface Props {
  title: string;
  left: ButtonProps[];
  right: ButtonProps[];
  canDrop?: boolean;
  onDrop?: (item: unknown) => void;
}

// eslint-disable-next-line mobx/missing-observer
export default function ExplorerHeader({ title, onDrop, left, right, canDrop = true }: Props) {
  return (
    <div className="relative shrink-0 h-10 mb-2 flex items-center justify-between">
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      {!canDrop && (
        <div className="flex grow justify-between">
          <div className="flex">
            {left.map((props, i) => (
              <Button {...props} key={i} />
            ))}
          </div>
          <div className="flex">
            {right.map((props, i) => (
              <Button {...props} key={i} />
            ))}
          </div>
        </div>
      )}
      {onDrop && canDrop && (
        <Droppable
          onDrop={onDrop}
          className="flex mx-2 rounded h-3/4 box-border grow items-center justify-center border border-dashed text-sm text-text-secondary"
        >
          拖拽至此处移至根目录
        </Droppable>
      )}
    </div>
  );
}
