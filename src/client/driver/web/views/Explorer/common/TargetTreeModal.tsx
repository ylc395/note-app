import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import Modal from '@web/components/Modal';
import Tree from '@web/components/Tree';
import NodeTitle from './TreeView/NodeTitle';
import type MoveBehavior from '@domain/app/service/common/MoveBehavior';

export default observer(function TargetTreeModal({
  moveBehavior: { moveByTargetTree, stopSelectingTarget, targetTree },
}: {
  moveBehavior: MoveBehavior;
}) {
  if (!targetTree) {
    return null;
  }

  return (
    <Modal
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      canConfirm={targetTree.selectedNodes.length > 0}
      onConfirm={moveByTargetTree}
      onCancel={stopSelectingTarget}
    >
      {targetTree && (
        <Tree
          showRoot
          onClick={(node) => node.toggleSelect({ value: true })}
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
