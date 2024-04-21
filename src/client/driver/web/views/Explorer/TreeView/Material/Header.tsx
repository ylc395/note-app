import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusIcon, ShrinkIcon, SortDescIcon } from 'lucide-react';

import MaterialService from '@domain/app/service/MaterialService';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import { MaterialTypes } from '@shared/domain/model/material';
import { SortBy } from '@domain/app/model/abstract/Explorer/SortBehavior';
import ExplorerHeader from '../common/Header';
import MoveBehavior from '@domain/app/model/behavior/MoveBehavior';

export default observer(function Header() {
  const {
    canCollapse,
    entityType,
    collapseAll,
    sorter: { by: sortBy, setBy: setSortBy },
    tree: { root },
  } = container.resolve(MaterialExplorer);

  const {
    creation: { create },
  } = container.resolve(MaterialService);

  const { moveTo, isDraggingMoving } = container.resolve(MoveBehavior);

  function getMenuItem({ label, key }: { label: string; key: SortBy }) {
    return { label, key, checked: key === sortBy };
  }

  return (
    <ExplorerHeader
      left={[
        {
          icon: <PlusIcon />,
          menuOptions: {
            items: [
              { label: '创建目录', key: MaterialTypes.Directory },
              { label: '创建素材', key: MaterialTypes.Entity },
            ],
            onSelect: (key) => create(null, key as MaterialTypes),
          },
        },
      ]}
      right={[
        { icon: <ShrinkIcon />, onClick: collapseAll, disabled: !canCollapse },
        {
          icon: <SortDescIcon />,
          menuOptions: {
            onSelect: (key) => setSortBy(key as SortBy),
            items: [
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
        },
      ]}
      canDrop={isDraggingMoving && !root.isDisabled}
      onDrop={() => moveTo({ entityType, entityId: null })}
      title="素材"
    />
  );
});
