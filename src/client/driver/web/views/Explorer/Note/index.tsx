import { container } from 'tsyringe';
import NoteExplorer from '@domain/app/model/note/Explorer';

import TreeView from './TreeView';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorerView() {
  const { tree } = container.resolve(NoteExplorer);

  return (
    <>
      <Header />
      <TreeView />
      <TargetTreeModal tree={tree} />
    </>
  );
});
