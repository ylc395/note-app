import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusIcon, ShrinkIcon, SortDescIcon } from 'lucide-react';

import NoteService from '@domain/app/service/NoteService';
import NoteExplorer from '@domain/app/model/note/Explorer';
import { SortBy } from '@domain/app/model/abstract/Explorer/SortBehavior';
import MoveBehavior from '@domain/app/model/behavior/MoveBehavior';

import ExplorerHeader from '../common/Header';

export default observer(function Header() {
  const {
    canCollapse,
    collapseAll,
    entityType,
    sorter: { by: sortBy, setBy: setSortBy },
    tree: { root },
  } = container.resolve(NoteExplorer);

  const { createNote } = container.resolve(NoteService);

  function getMenuItem({ label, key }: { label: string; key: SortBy }) {
    return { label, key, checked: key === sortBy };
  }

  const { moveTo, isDraggingMoving } = container.resolve(MoveBehavior);

  return (
    <ExplorerHeader
      left={[{ icon: <PlusIcon />, onClick: createNote }]}
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
      title="笔记"
    />
  );
});
