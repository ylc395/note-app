import { container } from 'tsyringe';

import MaterialService from '@domain/app/service/MaterialService';
import { MOVE_TARGET_MODAL } from '@domain/app/model/material/prompts';
import DirectoryView from './TreeView';
import NewMaterialModal from './NewMaterialFormModal';
import Header from './Header';
import TargetTreeModal from '../common/TargetTreeModal';

// eslint-disable-next-line mobx/missing-observer
export default (function MaterialExplorerView() {
  const {
    move: { createTargetTree: getTargetTree },
  } = container.resolve(MaterialService);

  return (
    <>
      <Header />
      <DirectoryView />
      <NewMaterialModal />
      <TargetTreeModal modalId={MOVE_TARGET_MODAL} targetTreeFactory={getTargetTree} />
    </>
  );
});
