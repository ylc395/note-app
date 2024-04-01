import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { AiOutlineFileAdd, AiOutlineFolderAdd, AiOutlineShrink, AiOutlineSortAscending } from 'react-icons/ai';
import { useMemo } from 'react';

import MaterialService from '@domain/app/service/MaterialService';
import MaterialExplorer, { SortBy } from '@domain/app/model/material/Explorer';
import { useDragItem } from '@web/components/dnd/hooks';
import ExplorerHeader from '../common/ExplorerHeader';

export default observer(function Header() {
  const {
    canCollapse: hasExpandedNode,
    collapseAll,
    tree: { root },
    dnd: { status },
    sortBy,
    setSortBy,
  } = container.resolve(MaterialExplorer);
  const {
    creation: { createDirectory, startCreating },
    move: { moveByItems: moveMaterialsByItems },
  } = container.resolve(MaterialService);

  const { item: dragItem } = useDragItem();
  const canDrop = useMemo(
    () => status === 'toDrop' && !root.isDisabled && MaterialService.getMaterialIds(dragItem),
    [root.isDisabled, dragItem, status],
  );
  const onDrop = canDrop ? (item: unknown) => moveMaterialsByItems(null, item) : undefined;

  function getMenuItem({ label, key }: { label: string; key: SortBy }) {
    return { label, key, checked: key === sortBy };
  }

  return (
    <ExplorerHeader
      left={[
        { icon: <AiOutlineFolderAdd />, onClick: () => createDirectory(null) },
        { icon: <AiOutlineFileAdd />, onClick: () => startCreating(null) },
      ]}
      right={[
        { icon: <AiOutlineShrink />, onClick: collapseAll, disabled: !hasExpandedNode },
        {
          icon: <AiOutlineSortAscending />,
          onMenuClick: (key) => setSortBy(key as SortBy),
          menuItems: [
            getMenuItem({ label: '按名称升序', key: SortBy.TitleAsc }),
            getMenuItem({ label: '按名称降序', key: SortBy.TitleDesc }),
            { type: 'separator' },
            getMenuItem({ label: '按创建日期升序', key: SortBy.CreatedAtAsc }),
            getMenuItem({ label: '按创建日期降序', key: SortBy.CreatedAtDesc }),
            { type: 'separator' },
            getMenuItem({ label: '按修改时间升序', key: SortBy.UpdatedAtAsc }),
            getMenuItem({ label: '按修改时间降序', key: SortBy.UpdatedAtDesc }),
          ],
        },
      ]}
      onDrop={onDrop}
      title="素材"
    />
  );
});
