import { observer } from 'mobx-react-lite';
// import Modal from '@web/components/Modal';

import DirectoryOperations from './Operations';
import DirectoryView from './TreeView';
// import NewMaterial from './NewMaterial';
import ExplorerHeader from '../components/ExplorerHeader';

export default observer(() => {
  return (
    <>
      <ExplorerHeader title="素材">
        <DirectoryOperations />
      </ExplorerHeader>
      <DirectoryView />
      {/* <Modal open={Boolean(targetId.value)}>
        <NewMaterial />
      </Modal> */}
    </>
  );
});
