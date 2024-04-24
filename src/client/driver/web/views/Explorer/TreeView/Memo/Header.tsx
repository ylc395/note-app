import { container } from 'tsyringe';
import { PlusIcon, CalendarDaysIcon, SortDescIcon } from 'lucide-react';

import MemoExplorer, { type Order } from '@domain/app/model/memo/Explorer';
import ExplorerHeader from '../common/Header';

// eslint-disable-next-line mobx/missing-observer
export default (function Header() {
  const { togglePanel, order, setOrder } = container.resolve(MemoExplorer);

  function getMenuItem({ label, key }: { label: string; key: typeof order }) {
    return { label, key, checked: key === order };
  }

  return (
    <ExplorerHeader
      title="Memo"
      left={[
        { icon: <PlusIcon />, onClick: () => togglePanel('editor') },
        { icon: <CalendarDaysIcon />, onClick: () => togglePanel('calendar') },
      ]}
      right={[
        {
          icon: <SortDescIcon />,
          menuOptions: {
            onSelect: (order) => setOrder(order as Order),
            items: [
              getMenuItem({ key: 'asc', label: '子 Memo 升序' }),
              getMenuItem({ key: 'desc', label: '子 Memo 降序' }),
            ],
          },
        },
      ]}
    />
  );
});
