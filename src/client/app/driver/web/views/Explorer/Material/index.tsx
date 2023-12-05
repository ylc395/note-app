import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import MaterialService from '@domain/service/MaterialService';
// import Modal from '@components/Modal';

import DirectoryOperations from './Operations';
import DirectoryView from './TreeView';
// import NewMaterial from './NewMaterial';
import ExplorerHeader from '../components/ExplorerHeader';

export default observer(() => {
  const { targetId } = container.resolve(MaterialService);

  return (
    <>
      <ExplorerHeader title="素材库">
        <DirectoryOperations />
      </ExplorerHeader>
      <DirectoryView />
      {/* <Modal open={Boolean(targetId.value)}>
        <NewMaterial />
      </Modal> */}
    </>
  );
});
