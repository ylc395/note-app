import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { AiOutlineFileAdd, AiOutlineFolderAdd, AiOutlineShrink, AiOutlineSetting } from 'react-icons/ai';
import { useMemo } from 'react';

import MaterialService from '@domain/app/service/MaterialService';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import { useDragItem } from '@web/components/dnd/hooks';
import ExplorerHeader from '../common/ExplorerHeader';

export default observer(function Header() {
  const {
    creation: { createDirectory, startCreating },
    move: { moveByItems: moveMaterialsByItems },
  } = container.resolve(MaterialService);
  const {
    canCollapse: hasExpandedNode,
    collapseAll,
    tree: { root },
    dnd: { status },
  } = container.resolve(MaterialExplorer);

  const { item: dragItem } = useDragItem();
  const canDrop = useMemo(
    () => status === 'toDrop' && !root.isDisabled && MaterialService.getMaterialIds(dragItem),
    [root.isDisabled, dragItem, status],
  );
  const onDrop = canDrop ? (item: unknown) => moveMaterialsByItems(null, item) : undefined;

  return (
    <ExplorerHeader
      left={[
        { icon: <AiOutlineFolderAdd />, onClick: () => createDirectory(null) },
        { icon: <AiOutlineFileAdd />, onClick: () => startCreating(null) },
      ]}
      right={[
        { icon: <AiOutlineShrink />, onClick: collapseAll, disabled: !hasExpandedNode },
        { icon: <AiOutlineSetting />, onClick: () => {} },
      ]}
      onDrop={onDrop}
      title="素材"
    />
  );
});
