import { container } from 'tsyringe';
import MaterialExplorer from '@domain/app/model/material/Explorer';

import DirectoryView from './TreeView';
import NewMaterialModal from './NewMaterialFormModal';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default (function MaterialExplorerView() {
  const { tree } = container.resolve(MaterialExplorer);

  return (
    <>
      <Header />
      <DirectoryView />
      <NewMaterialModal />
      <TargetTreeModal tree={tree} />
    </>
  );
});
