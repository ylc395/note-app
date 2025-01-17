import { onCleanup } from 'solid-js';
import MemoView from '#domain/client/app/model/memo/MemoView';

import Editor from './Editor';
import List from './List';
import ListToolbar from './ListToolbar';
import Sidebar from './Sidebar';

export default function MemoList() {
  const rootMemo = new MemoView();
  onCleanup(() => rootMemo.destroy());

  return (
    <div class="flex h-screen px-4 max-w-3xl mx-auto justify-center">
      <Sidebar />
      <div class="flex flex-col h-full">
        {/** 这里不能 assert(memoVIew.newEditor)，因为一旦读了一下 memoView.newEditor，这整个组件都会受该值的变化的影响而重新渲染 */}
        <Editor editor={rootMemo.newEditor!} />
        <ListToolbar rootMemo={rootMemo} />
        <List node={rootMemo} />
      </div>
    </div>
  );
}
