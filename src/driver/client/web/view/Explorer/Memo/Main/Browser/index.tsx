import { onCleanup } from 'solid-js';

import MemoView from '#domain/client/app/model/memo/MemoView';
import Editor from './Editor';
import List from './List';
import ListToolbar from './ListToolBar';
import Sidebar from './Sidebar';

export default function MemoMain() {
  const rootMemo = new MemoView();

  onCleanup(() => {
    rootMemo.destroy();
  });

  return (
    <>
      <div class="flex flex-col py-4 mr-6 grow">
        <Editor editor={rootMemo.newEditor!} />
        <ListToolbar rootMemo={rootMemo} />
        <List memoView={rootMemo} />
      </div>
      <Sidebar />
    </>
  );
}
