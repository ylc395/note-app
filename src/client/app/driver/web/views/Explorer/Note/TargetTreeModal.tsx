import { useContext, useEffect } from 'react';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';
import { observer } from 'mobx-react-lite';

import Modal from '@components/Modal';
import Tree from '@components/Tree';
import NoteTree from '@domain/model/note/Tree';
import NoteService from '@domain/service/NoteService';
import ctx from './context';
import assert from 'assert';
import Explorer from '@domain/model/Explorer';

export default observer(function TargetTreeModal() {
  const { movingModal } = useContext(ctx);
  const { moveNotes } = container.resolve(NoteService);
  const { noteTree } = container.resolve(Explorer);

  const targetTree = useCreation(
    () => (movingModal.isOpen ? new NoteTree(noteTree.selectedNodeIds) : null),
    [movingModal.isOpen],
  );

  const onConfirm = () => {
    assert(targetTree);
    moveNotes(targetTree.getSelectedId());
    movingModal.close();
  };

  useEffect(() => {
    targetTree?.loadChildren();
  }, [targetTree]);

  return (
    <Modal
      isOpen={movingModal.isOpen}
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      canConfirm={targetTree ? targetTree.selectedNodeIds.length > 0 : false}
      onConfirm={onConfirm}
      onCancel={movingModal.close}
    >
      {targetTree && <Tree rootTitle="根目录" tree={targetTree} />}
    </Modal>
  );
});
