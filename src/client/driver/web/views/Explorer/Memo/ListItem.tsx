import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import { AiOutlineEdit, AiOutlinePushpin } from 'react-icons/ai';

import MemoService from '@domain/app/service/MemoService';
import type { MemoVO } from '@shared/domain/model/memo';
import Editor from './Editor';

import Button from '@web/components/Button';

export default observer(function ListItem({ id }: { id: MemoVO['id'] }) {
  const { list } = container.resolve(MemoService);
  const memo = list.get(id);
  const editor = list.getEditor(id);

  return (
    <div className="mb-4 rounded-xl bg-white px-1">
      {editor && <Editor editor={editor} />}
      <div className="min-h-[100px]  p-2">{memo.body}</div>
      <div>
        {memo.isPinned && <div>Pinned</div>}
        <time>{dayjs(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        <div className="flex">
          <Button onClick={() => list.edit(memo.id)}>
            <AiOutlineEdit />
          </Button>
          <Button onClick={() => list.toggleMemoPin(memo.id)}>
            <AiOutlinePushpin />
          </Button>
        </div>
      </div>
    </div>
  );
});
