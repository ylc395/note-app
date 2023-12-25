import { useContext, useEffect } from 'react';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';
import { observer } from 'mobx-react-lite';
import assert from 'assert';

import Modal from '@web/components/Modal';
import Tree from '@web/components/Tree';
import NoteService from '@domain/app/service/NoteService';
import TargetTree from '@domain/app/model/note/TargetTree';
import ctx from './context';

export default observer(function TargetTreeModal() {
  const { movingModal } = useContext(ctx);
  const { moveNotes } = container.resolve(NoteService);
  const targetTree = useCreation(() => (movingModal.isOpen ? new TargetTree() : null), [movingModal.isOpen]);

  const onConfirm = () => {
    assert(targetTree);
    // moveNotes(targetTree.getSelectedId());
    movingModal.close();
  };

  return (
    <Modal
      isOpen={movingModal.isOpen}
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      // canConfirm={targetTree ? targetTree.selectedNodeIds.length > 0 : false}
      onConfirm={onConfirm}
      onCancel={movingModal.close}
    >
      {targetTree && (
        <Tree
          showRoot
          nodeClassName=" 
            data-[selected=true]:bg-slate-100
            data-[disabled=true]:cursor-not-allowed
            data-[disabled=true]:opacity-30 
            py-1 cursor-pointer group relative"
          caretClassName="text-gray-500"
          tree={targetTree}
        />
      )}
    </Modal>
  );
});
