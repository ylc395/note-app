import { container } from 'tsyringe';
import { AiOutlineEdit, AiOutlineSetting, AiOutlineCalendar } from 'react-icons/ai';

import MemoExplorer from '@domain/app/model/memo/Explorer';
import ExplorerHeader from '../common/ExplorerHeader';

// eslint-disable-next-line mobx/missing-observer
export default (function Header() {
  const { togglePanel } = container.resolve(MemoExplorer);

  return (
    <ExplorerHeader
      title="Memo"
      left={[
        { icon: <AiOutlineEdit />, onClick: () => togglePanel('editor') },
        { icon: <AiOutlineCalendar />, onClick: () => togglePanel('calendar') },
      ]}
      right={[{ icon: <AiOutlineSetting />, onClick: () => {} }]}
    />
  );
});
