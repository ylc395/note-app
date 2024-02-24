import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import MemoService from '@domain/app/service/MemoService';
import { MemoVO } from '@shared/domain/model/memo';
import ListItem from './index';
import Editor from '../../Editor';

export default observer(function ChildrenList({ id }: { id: MemoVO['id'] }) {
  const { list } = container.resolve(MemoService);
  const editor = list.getEditor(id, true);
  const children = list.getChildren(id);

  useEffect(() => {
    list.edit(id, true);
    list.loadChildren(id);
  }, [id, list]);

  return (
    <div>
      {editor && <Editor editor={editor} />}
      {children.map((childMemo) => (
        <ListItem key={childMemo.id} id={childMemo.id} />
      ))}
    </div>
  );
});
