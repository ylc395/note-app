import TreeView from './TreeView';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default (function NoteExplorerView() {
  return (
    <>
      <Header />
      <TreeView />
      <TargetTreeModal />
    </>
  );
});
