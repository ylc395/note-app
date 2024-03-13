import { container } from 'tsyringe';

import TreeView from './TreeView';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';
import NoteService from '@domain/app/service/NoteService';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorerView() {
  const { move } = container.resolve(NoteService);

  return (
    <>
      <Header />
      <TreeView />
      <TargetTreeModal moveBehavior={move} />
    </>
  );
});
