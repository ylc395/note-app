import { observer } from 'mobx-react-lite';
import { container } from '#domain/shared/infra/singletons';
import { createPortal } from 'react-dom';

import Explorer from '#domain/client/app/model/abstract/Explorer';
import { APP_NAME } from '#domain/shared/infra/env';
import ExplorerManager from '#domain/client/app/model/ExplorerManager';

import Tree from '#web/components/Tree';
import NodeTitle from '../NodeTitle';
import assert from 'assert';
import { useMemo } from 'react';

export default observer(function Preview() {
  const { currentExplorer } = container.resolve(ExplorerManager);
  assert(currentExplorer instanceof Explorer);

  const previewTree = useMemo(() => {
    const previewTree = currentExplorer.createTree();
    const selectedEntities = currentExplorer.tree.selectedNodes.map(({ value }) => ({ ...value!, parentId: null }));
    previewTree.add(selectedEntities);

    return previewTree;
  }, [currentExplorer]);

  return createPortal(
    <div className={APP_NAME}>
      <Tree
        className="rounded-md pointer-events-none fixed max-w-[300px] opacity-60 text-sm"
        iconClassName="invisible"
        nodeClassName="py-1 opacity-60"
        tree={previewTree}
        renderTitle={(node) => <NodeTitle node={node}></NodeTitle>}
      />
    </div>,
    document.body,
  );
});
