import { onCleanup } from 'solid-js';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';

import Editor from './Editor';
import ListToolbar from './ListToolBar';
import Sidebar from './Sidebar';
import FocusView from './FocusView';
import List from './List';

export default function MemoMain() {
  const memoList = container.resolve(MemoList);

  onCleanup(() => {
    memoList.destroy();
  });

  return (
    <>
      <div class="flex flex-col grow min-w-0">
        <Editor editor={memoList.newEditor} />
        <ListToolbar />
        <List />
      </div>
      <Sidebar />
      <FocusView />
    </>
  );
}
