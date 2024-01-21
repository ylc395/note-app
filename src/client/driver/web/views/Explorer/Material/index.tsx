import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useMemo } from 'react';

import DirectoryOperations from './Operations';
import DirectoryView from './TreeView';
import NewMaterialModal from './NewMaterialFormModal';
import ExplorerHeader from '../common/ExplorerHeader';
import TargetTreeModal from '../common/TargetTreeModal';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import { useDragItem } from '@web/components/dnd/hooks';
import MaterialService from '@domain/app/service/MaterialService';

export default observer(() => {
  const {
    tree,
    dnd: { status },
  } = container.resolve(MaterialExplorer);

  const {
    move: { byItems: moveMaterialsByItems },
  } = container.resolve(MaterialService);
  const { item: dragItem } = useDragItem();

  const canDrop = useMemo(
    () => status === 'toDrop' && !tree.root.isDisabled && MaterialService.getMaterialIds(dragItem),
    [tree.root.isDisabled, dragItem, status],
  );
  const onDrop = canDrop ? (item: unknown) => moveMaterialsByItems(null, item) : undefined;

  return (
    <>
      <ExplorerHeader onDrop={onDrop} title="素材">
        <DirectoryOperations />
      </ExplorerHeader>
      <DirectoryView />
      <NewMaterialModal />
      <TargetTreeModal tree={tree} />
    </>
  );
});
