import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import { AiOutlineEdit, AiOutlinePushpin, AiOutlineComment } from 'react-icons/ai';

import MemoService from '@domain/app/service/MemoService';
import type { MemoVO } from '@shared/domain/model/memo';

import Button from '@web/components/Button';
import Body from './Body';
import ChildrenList from './ChildrenList';
import { useState } from 'react';

const ListItem = observer(function ({ id }: { id: MemoVO['id'] }) {
  const { explorer } = container.resolve(MemoService);
  const memo = explorer.getMemo(id);
  const isChild = Boolean(memo.parentId);
  const [isChildrenVisible, setIsChildrenVisible] = useState(false);

  function toggleChildren() {
    const isExpanded = explorer.toggleExpand(id);
    setIsChildrenVisible(isExpanded);
  }

  return (
    <div className="mb-4 rounded-xl bg-white px-1">
      <Body id={id} />
      <div>
        {memo.isPinned && <div>Pinned</div>}
        <time>{dayjs(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        <div className="flex">
          <Button onClick={() => explorer.startEditing(memo.id)}>
            <AiOutlineEdit />
          </Button>
          <Button onClick={() => explorer.togglePin(memo.id)}>
            <AiOutlinePushpin />
          </Button>
          {!isChild && (
            <Button onClick={toggleChildren}>
              <AiOutlineComment />
              {memo.childrenCount > 0 && memo.childrenCount}
            </Button>
          )}
        </div>
      </div>
      {isChildrenVisible && <ChildrenList id={id} />}
    </div>
  );
});

export default ListItem;
