import assert from 'assert';
import MemoView from '#domain/client/app/model/memo/MemoView';
import { onCleanup } from 'solid-js';

import Editor from './Editor';
import List from './List';

export default function MemoList() {
  const memoView = new MemoView();
  assert(memoView.newEditor, 'no newEditor');

  onCleanup(() => {
    memoView.destroy();
  });

  return (
    <div class="flex flex-col h-screen">
      <Editor editor={memoView.newEditor} />
      <div class="flex-grow overflow-auto">
        <List node={memoView} />
      </div>
    </div>
  );
}
