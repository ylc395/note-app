import { container } from 'tsyringe';

import MaterialService from '@domain/app/service/MaterialService';
import DirectoryView from './TreeView';
import NewMaterialModal from './NewMaterialFormModal';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialExplorerView() {
  const { move } = container.resolve(MaterialService);

  return (
    <>
      <Header />
      <DirectoryView />
      <NewMaterialModal />
      <TargetTreeModal moveBehavior={move} />
    </>
  );
}
