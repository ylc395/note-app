import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import Modal, { useModalValue } from '@web/components/Modal';
import Tree from '@web/components/Tree';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/prompts';
import NodeTitle from './TreeView/NodeTitle';
import type TreeModel from '@domain/common/model/abstract/Tree';
import getTargetTree from '@domain/app/model/abstract/targetTree';

export default observer(function TargetTreeModal({ tree }: { tree: TreeModel }) {
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
      id={MOVE_TARGET_MODAL}
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
