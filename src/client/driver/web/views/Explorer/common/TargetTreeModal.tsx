import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import type TreeModel from '@domain/common/model/abstract/Tree';
import getTargetTree from '@domain/app/model/abstract/targetTree';
import type { PromptToken } from '@shared/domain/infra/ui';
import type { EntityParentId } from '@shared/domain/model/entity';

import Modal, { useModalValue } from '@web/components/Modal';
import Tree from '@web/components/Tree';
import NodeTitle from './TreeView/NodeTitle';

export default observer(function TargetTreeModal({
  tree,
  modalId,
}: {
  tree: TreeModel;
  modalId: PromptToken<EntityParentId>;
}) {
  const { value: targetTree, modalProps } = useModalValue(() => getTargetTree(tree));
  const getTargetId = () => targetTree?.getSelectedNodeIds(true)[0];

  useEffect(() => {
    if (targetTree) {
      targetTree.root.loadChildren();
    }
  }, [targetTree]);

  return (
    <Modal
      {...modalProps}
      id={modalId}
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      getSubmitResult={getTargetId}
    >
      {targetTree && (
        <Tree
          showRoot
          onClick={(node) => targetTree.toggleSelect(node.id, { value: true })}
          nodeClassName={(node) =>
            clsx(
              node.isSelected && 'bg-slate-100',
              node.isDisabled && 'cursor-not-allowed opacity-30',
              'group relative cursor-pointer py-1',
            )
          }
          renderTitle={(node) => <NodeTitle node={node} />}
          caretClassName="text-gray-500"
          tree={targetTree}
        />
      )}
    </Modal>
  );
});
