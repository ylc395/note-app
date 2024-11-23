import { container } from 'tsyringe';
import { PlusIcon, CalendarDaysIcon, SortDescIcon } from 'lucide-react';

import ListView, { type Order } from '#domain/client/app/model/memo/ListView';
import ExplorerHeader from '../common/Header';

// eslint-disable-next-line mobx/missing-observer
export default (function Header() {
  const { togglePanel, order: currentOrder, setOrder } = container.resolve(ListView);

  function getMenuItem({ label, order }: { label: string; order: Order }) {
    return { label, onSelect: () => setOrder(order), checked: currentOrder === order };
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
          menuItems: [
            getMenuItem({ order: 'asc', label: '子 Memo 升序' }),
            getMenuItem({ order: 'desc', label: '子 Memo 降序' }),
          ],
        },
      ]}
    />
  );
});
