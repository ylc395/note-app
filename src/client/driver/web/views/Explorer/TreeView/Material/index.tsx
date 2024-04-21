import DirectoryView from './TreeView';
import NewMaterialModal from './NewMaterialFormModal';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialExplorerView() {
  return (
    <>
      <Header />
      <DirectoryView />
      <NewMaterialModal />
      <TargetTreeModal />
    </>
  );
}
