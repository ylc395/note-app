import { onCleanup } from 'solid-js';
import MemoView from '#domain/client/app/model/memo/MemoView';

import Editor from './Editor';
import List from './List';
import ListToolbar from './ListToolbar';
import Sidebar from './Sidebar';
import assert from 'assert';

export default function MemoExplorer() {
  const rootMemo = new MemoView();
  assert(rootMemo.newEditor, 'no new editor');

  onCleanup(() => {
    rootMemo.destroy();
  });

  return (
    <div class="flex h-screen px-4 mx-auto justify-center">
      <Sidebar />
      <div class="flex flex-col h-full pt-4 max-w-screen-md w-full lg:w-3/4">
        <Editor editor={rootMemo.newEditor} />
        <ListToolbar rootMemo={rootMemo} />
        <List node={rootMemo} />
      </div>
    </div>
  );
}
