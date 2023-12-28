import { useState } from 'react';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import assert from 'assert';

import Modal from '@web/components/Modal';
import Tree from '@web/components/Tree';
import NoteService from '@domain/app/service/NoteService';
import TargetTree from '@domain/app/model/note/TargetTree';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/modals';

export default observer(function TargetTreeModal() {
  const { moveNotes, tree } = container.resolve(NoteService);
  const [isOpen, setIsOpen] = useState(false);
  const targetTree = useCreation(() => (isOpen ? TargetTree.from(tree) : null), [isOpen]);

  const onConfirm = async () => {
    assert(targetTree?.targetId !== undefined);
    await moveNotes({ targetId: targetTree.targetId });
    return true;
  };

  return (
    <Modal
      id={MOVE_TARGET_MODAL}
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      canConfirm={targetTree?.targetId !== undefined}
      onToggle={setIsOpen}
      onConfirm={onConfirm}
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
          caretClassName="text-gray-500"
          tree={targetTree}
        />
      )}
    </Modal>
  );
});
