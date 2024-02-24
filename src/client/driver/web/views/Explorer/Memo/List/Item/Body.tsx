import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import { MemoVO } from '@shared/domain/model/memo';
import MemoService from '@domain/app/service/MemoService';
import Editor from '../../Editor';

export default observer(function Body({ id }: { id: MemoVO['id'] }) {
  const { list } = container.resolve(MemoService);
  const editor = list.getEditor(id);
  const memo = list.get(id);

  return (
    <div>
      {editor && <Editor editor={editor} />}
      <div className="min-h-[100px]  p-2">{memo.body}</div>
    </div>
  );
});
