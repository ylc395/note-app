import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import { useCreation } from 'ahooks';

import type Tree from '@domain/model/abstract/Tree';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

interface Props {
  children: ReactNode;
  title: string;
  tree?: Tree;
}

export default observer(function ExplorerHeader({ children, title, tree }: Props) {
  const id = useCreation(uniqueId, []);
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !tree, data: { instance: tree?.root } });

  return (
    <div
      className={clsx(
        'relative mb-2 flex items-center justify-between',
        isOver && !tree?.root.isValidTarget && 'cursor-no-drop',
      )}
      ref={setNodeRef}
    >
      <h1 className="m-0 mr-1 text-base">{title}</h1>
      {children}
      {tree?.root.isValidTarget && (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed bg-gray-50 text-gray-500">
          拖拽至此处移至根目录
        </div>
      )}
    </div>
  );
});
