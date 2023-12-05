import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import { useCreation } from 'ahooks';
import clsx from 'clsx';

import Tree from '@domain/model/abstract/Tree';
import DndService from '@domain/service/DndService';
import { container } from 'tsyringe';
import Explorer from '@domain/model/Explorer';

interface Props {
  children: ReactNode;
  title: string;
  tree?: Tree;
}

export default function ExplorerHeader({ children, title, tree }: Props) {
  const id = useCreation(uniqueId, []);
  const { setNodeRef } = useDroppable({ id, disabled: !tree, data: { instance: tree?.root } });
  const { draggingItem } = container.resolve(DndService);
  const { isTreeNode } = container.resolve(Explorer);

  return (
    <div className={clsx('relative mb-2 flex items-center justify-between')} ref={setNodeRef}>
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      {children}
      {isTreeNode(draggingItem) && tree && !tree.root.isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed bg-gray-50 text-gray-500">
          拖拽至此处移至根目录
        </div>
      )}
    </div>
  );
}
