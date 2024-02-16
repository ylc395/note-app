import { container } from 'tsyringe';
import { AiOutlineEdit, AiOutlineSetting, AiOutlineCalendar } from 'react-icons/ai';

import MemoService from '@domain/app/service/MemoService';
import ExplorerHeader from '../common/ExplorerHeader';

// eslint-disable-next-line mobx/missing-observer
export default (function Header() {
  const {
    list: { togglePanel },
  } = container.resolve(MemoService);

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
