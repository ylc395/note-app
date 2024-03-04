import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import MemoService from '@domain/app/service/MemoService';
import { MemoVO } from '@shared/domain/model/memo';
import ListItem from './index';
import Editor from '../../Editor';

export default observer(function ChildrenList({ id }: { id: MemoVO['id'] }) {
  const { explorer } = container.resolve(MemoService);
  const editor = explorer.getEditor(id, true);
  const children = explorer.getChildren(id);

  return (
    <div>
      {editor && <Editor editor={editor} />}
      {children.map((childMemo) => (
        <ListItem key={childMemo.id} id={childMemo.id} />
      ))}
    </div>
  );
});
