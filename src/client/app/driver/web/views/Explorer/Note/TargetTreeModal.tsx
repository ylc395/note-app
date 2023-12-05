import { useContext, useEffect } from 'react';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';

import Modal from '@components/Modal';
import Tree from '@components/Tree';
import NoteTree from '@domain/model/note/Tree';
import NoteService from '@domain/service/NoteService';
import ctx from './context';

// eslint-disable-next-line mobx/missing-observer
export default (function TargetTreeModal() {
  const { movingModal } = useContext(ctx);
  const { moveNotes } = container.resolve(NoteService);
  const targetTree = useCreation(() => new NoteTree(), []);

  const onConfirm = () => {
    moveNotes(targetTree.getSelectedId());
    movingModal.close();
  };

  useEffect(() => {
    targetTree.loadChildren();
  }, [targetTree]);

  return (
    <Modal isOpen={movingModal.isOpen} onConfirm={onConfirm} onCancel={movingModal.close}>
      <Tree tree={targetTree} />
    </Modal>
  );
});
