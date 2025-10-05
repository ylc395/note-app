import { onCleanup } from 'solid-js';

import container from '#utils/singletonContainer';
import MemoList from '#domain/client/app/model/memo/List';

import Editor from './Editor';
import ListToolbar from './ListToolBar';
import List from './List';

export default function MemoMain() {
  const memoList = container.resolve(MemoList);

  onCleanup(() => {
    memoList.destroy();
  });

  return (
    <div class="flex flex-col grow min-h-0">
      <Editor editor={memoList.newEditor} />
      <ListToolbar />
      <List />
    </div>
  );
}
