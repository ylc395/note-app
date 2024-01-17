import { observer } from 'mobx-react-lite';
// import Modal from '@web/components/Modal';

import DirectoryOperations from './Operations';
import DirectoryView from './TreeView';
import NewMaterialModal from './NewMaterialFormModal';
import ExplorerHeader from '../common/ExplorerHeader';

export default observer(() => {
  return (
    <>
      <ExplorerHeader title="素材">
        <DirectoryOperations />
      </ExplorerHeader>
      <DirectoryView />
      <NewMaterialModal />
    </>
  );
});
