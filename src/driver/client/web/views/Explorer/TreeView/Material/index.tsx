import TreeView from './TreeView';
import Header from './Header';
import TargetTreeModal from '../common/MoveTargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialExplorerView() {
  return (
    <>
      <Header />
      <TreeView />
      <TargetTreeModal />
    </>
  );
}
