import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import { AiOutlineEdit, AiOutlinePushpin, AiOutlineComment } from 'react-icons/ai';
import { useBoolean } from 'ahooks';

import MemoService from '@domain/app/service/MemoService';
import type { MemoVO } from '@shared/domain/model/memo';

import Button from '@web/components/Button';
import Body from './Body';
import ChildrenList from './ChildrenList';

const ListItem = observer(function ({ id }: { id: MemoVO['id'] }) {
  const { list } = container.resolve(MemoService);
  const [childrenVisible, { toggle: toggleChildren }] = useBoolean(false);
  const memo = list.get(id);
  const isChild = Boolean(memo.parentId);

  return (
    <div className="mb-4 rounded-xl bg-white px-1">
      <Body id={id} />
      <div>
        {memo.isPinned && <div>Pinned</div>}
        <time>{dayjs(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        <div className="flex">
          <Button onClick={() => list.edit(memo.id)}>
            <AiOutlineEdit />
          </Button>
          <Button onClick={() => list.togglePin(memo.id)}>
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
      {childrenVisible && <ChildrenList id={id} />}
    </div>
  );
});

export default ListItem;
