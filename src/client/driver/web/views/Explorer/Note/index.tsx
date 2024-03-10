import { container } from 'tsyringe';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/prompts';

import TreeView from './TreeView';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';
import NoteService from '@domain/app/service/NoteService';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorerView() {
  const {
    move: { createTargetTree: getTargetTree },
  } = container.resolve(NoteService);

  return (
    <>
      <Header />
      <TreeView />
      <TargetTreeModal targetTreeFactory={getTargetTree} modalId={MOVE_TARGET_MODAL} />
    </>
  );
});
