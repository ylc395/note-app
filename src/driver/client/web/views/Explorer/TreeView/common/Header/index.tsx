import { useDrop } from 'react-dnd';
import { entityLocatorTypeId, type HierarchyEntity } from '#domain/client/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import MoveBehavior from '#domain/client/app/model/abstract/Explorer/MoveBehavior';
import { noop } from 'lodash-es';

import type Tree from '#domain/client/shared/model/note/Tree';

interface Props<T extends HierarchyEntity> {
  title: string;
  tree?: Tree<T>;
}

export default function ExplorerHeader<T extends HierarchyEntity>({ title, tree }: Props<T>) {
  const { movingItems, perform } = container.resolve(MoveBehavior);

  const [{ canDrop }, connectDropTarget] = useDrop({
    accept: entityLocatorTypeId,
    drop: tree ? () => perform({ entityType: tree.entityType, entityId: null }) : noop,
    canDrop: () => Boolean(movingItems && tree && !tree.root.isDisabled),
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div className="relative shrink-0 h-10 mb-2 px-2 pt-2 flex items-center justify-between">
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      {!canDrop ? (
        <div className="flex grow justify-between">
          <div className="flex">
            {/* {left.map((props, i) => (
              // <Button {...props} key={i} />
            ))} */}
          </div>
          <div className="flex">
            {/* {right.map((props, i) => (
              <Button {...props} key={i} />
            ))} */}
          </div>
        </div>
      ) : (
        <div
          ref={connectDropTarget}
          className="flex mx-2 rounded h-3/4 box-border grow items-center justify-center border border-dashed text-sm text-text-secondary"
        >
          拖拽至此处移至根目录
        </div>
      )}
    </div>
  );
}
