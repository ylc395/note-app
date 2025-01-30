import { onCleanup } from 'solid-js';

import { container } from '#domain/shared/infra/singletons';
import MemoService from '#domain/client/app/service/MemoService';

import Editor from './Editor';
import List from './List';
import ListToolbar from './ListToolBar';
import Sidebar from './Sidebar';

export default function MemoMain() {
  const { rootMemo } = container.resolve(MemoService);

  onCleanup(() => {
    rootMemo.destroy();
  });

  return (
    <>
      <div class="flex flex-col grow">
        <Editor editor={rootMemo.newEditor!} />
        <ListToolbar />
        <List memoView={rootMemo} />
      </div>
      <Sidebar />
    </>
  );
}
