import { onCleanup } from 'solid-js';
import { action } from 'mobx';

import MemoView from '#domain/client/app/model/memo/MemoView';
import Editor from './Editor';
import List from './List';
import ListToolbar from './ListToolBar';
import RevisionListModal from './RevisionListModal';
import uiState from '../uiState';

export default function MemoMain() {
  const rootMemo = new MemoView();

  onCleanup(() => {
    rootMemo.destroy();
  });

  return (
    <div class="flex flex-col max-h-full py-4">
      <Editor editor={rootMemo.newEditor!} />
      <ListToolbar rootMemo={rootMemo} />
      <List memoView={rootMemo} />
      <RevisionListModal
        entityId={uiState.revisionViewId}
        onClose={action(() => (uiState.revisionViewId = undefined))}
      />
    </div>
  );
}
