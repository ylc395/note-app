import { onCleanup } from 'solid-js';
import MemoView from '#domain/client/app/model/memo/MemoView';

import Editor from './Editor';
import List from './List';

export default function MemoList() {
  const memoView = new MemoView();
  onCleanup(() => memoView.destroy());

  return (
    <div class="flex flex-col h-screen px-4">
      {/** 这里不能 assert(memoVIew.newEditor)，因为一旦读了一下 memoView.newEditor，这整个组件都会受该值的变化的影响而重新渲染 */}
      <Editor editor={memoView.newEditor!} />
      <List node={memoView} />
    </div>
  );
}
