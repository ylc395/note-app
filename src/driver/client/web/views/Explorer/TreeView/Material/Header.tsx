import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusIcon, ShrinkIcon, SortDescIcon } from 'lucide-react';

import MaterialService from '#domain/client/app/service/MaterialService';
import MaterialExplorer from '#domain/client/app/model/material/Explorer';
import { MaterialTypes } from '#domain/shared/model/material';
import { SortBy } from '#domain/client/app/model/abstract/Explorer/SortBehavior';
import ExplorerHeader from '../common/Header';
import MoveBehavior from '#domain/client/app/model/behavior/MoveBehavior';

export default observer(function Header() {
  const {
    canCollapse,
    entityType,
    collapseAll,
    sorter: { by: currentSortBy, setBy: setSortBy },
    tree: { root },
  } = container.resolve(MaterialExplorer);

  const {
    creation: { create },
  } = container.resolve(MaterialService);

  const { moveTo, isDraggingMoving } = container.resolve(MoveBehavior);

  function getMenuItem({ label, sortBy }: { label: string; sortBy: SortBy }) {
    return { label, checked: currentSortBy === sortBy, onSelect: () => setSortBy(sortBy) };
  }

  return (
    <ExplorerHeader
      left={[
        {
          icon: <PlusIcon />,
          menuItems: [
            { label: '创建目录', onSelect: () => create(null, MaterialTypes.Directory) },
            { label: '创建素材', onSelect: () => create(null, MaterialTypes.Entity) },
          ],
        },
      ]}
      right={[
        { icon: <ShrinkIcon />, onClick: collapseAll, disabled: !canCollapse },
        {
          icon: <SortDescIcon />,
          menuItems: [
            getMenuItem({ label: '按名称升序', sortBy: SortBy.TitleAsc }),
            getMenuItem({ label: '按名称降序', sortBy: SortBy.TitleDesc }),
            { type: 'separator' },
            getMenuItem({ label: '按创建日期升序', sortBy: SortBy.CreatedAtAsc }),
            getMenuItem({ label: '按创建日期降序', sortBy: SortBy.CreatedAtDesc }),
            { type: 'separator' },
            getMenuItem({ label: '按修改时间升序', sortBy: SortBy.UpdatedAtAsc }),
            getMenuItem({ label: '按修改时间降序', sortBy: SortBy.UpdatedAtDesc }),
          ],
        },
      ]}
      canDrop={isDraggingMoving && !root.isDisabled}
      onDrop={() => moveTo({ entityType, entityId: null })}
      title="素材"
    />
  );
});
