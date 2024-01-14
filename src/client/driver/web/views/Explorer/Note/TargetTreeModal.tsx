import { useState } from 'react';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import Modal from '@web/components/Modal';
import Tree from '@web/components/Tree';
import TargetTree from '@domain/app/model/note/TargetTree';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/modals';
import NodeTitle from '../components/TreeView/NodeTitle';
import NoteExplorer from '@domain/app/model/note/Explorer';

export default observer(function TargetTreeModal() {
  const { tree } = container.resolve(NoteExplorer);
  const [isOpen, setIsOpen] = useState(false);
  const targetTree = useCreation(() => (isOpen ? TargetTree.from(tree) : null), [isOpen]);

  return (
    <Modal
      id={MOVE_TARGET_MODAL}
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      value={targetTree?.targetId}
      onToggle={setIsOpen}
    >
      {targetTree && (
        <Tree
          showRoot
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
