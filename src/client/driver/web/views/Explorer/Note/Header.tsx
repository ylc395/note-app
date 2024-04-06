import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusIcon, ShrinkIcon, SortDescIcon } from 'lucide-react';
import { useMemo } from 'react';

import NoteService from '@domain/app/service/NoteService';
import NoteExplorer from '@domain/app/model/note/Explorer';
import { useDragItem } from '@web/components/dnd/hooks';
import { SortBy } from '@domain/app/model/abstract/Explorer/SortBehavior';

import ExplorerHeader from '../common/ExplorerHeader';

export default observer(function Header() {
  const {
    canCollapse: hasExpandedNode,
    collapseAll,
    tree: { root },
    dnd: { status },
    sorter: { by: sortBy, setBy: setSortBy },
  } = container.resolve(NoteExplorer);
  const {
    move: { moveByItems: moveNotesByItems },
    createNote,
  } = container.resolve(NoteService);

  const { item: dragItem } = useDragItem();
  const canDrop = useMemo(
    () => status === 'toDrop' && !root.isDisabled && NoteService.getNoteIds(dragItem),
    [root.isDisabled, dragItem, status],
  );
  const onDrop = canDrop ? (item: unknown) => moveNotesByItems(null, item) : undefined;

  function getMenuItem({ label, key }: { label: string; key: SortBy }) {
    return { label, key, checked: key === sortBy };
  }

  return (
    <ExplorerHeader
      left={[{ icon: <PlusIcon />, onClick: createNote }]}
      right={[
        { icon: <ShrinkIcon />, onClick: collapseAll, disabled: !hasExpandedNode },
        {
          icon: <SortDescIcon />,
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
      title="笔记"
    />
  );
});
