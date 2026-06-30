import { onCleanup, createEffect, createMemo } from 'solid-js';
import { Tabs, type TabsValueChangeDetails } from '@ark-ui/solid';
import dayjs from 'dayjs';
import { action } from 'mobx';

import type MemoList from '#domain/client/app/model/memo/List';
import type { MemoVO } from '#domain/shared/model/memo';
import Memo from '#domain/client/app/model/memo/Memo';

import Menu from './Menu';
import FollowupList from './FollowupList';
import Operation from './Operation';
import ReferrerList from './ReferrerList';
import RevisionModal from './RevisionModal';
import Editor from '../../Editor';
import { ContextProvider } from './context';

export default function Item(props: { memo: MemoVO; parent?: Memo | MemoList }) {
  const date = createMemo(() => dayjs(props.memo.createdAt));
  let divRef: HTMLDivElement | undefined;
  const memoView = new Memo(props.memo);

  createEffect(() => {
    memoView.setValue(props.memo);
  });

  onCleanup(() => {
    memoView.destroy();
  });

  function handleTabChange(e: TabsValueChangeDetails) {
    memoView.uiState.tab = e.value;
  }

  return (
    <ContextProvider memo={memoView}>
      <div ref={divRef} class="shadow-md rounded-lg border p-4 relative bg-bg-primary">
        <div class="flex justify-between items-center">
          <div class="flex text-fg-tertiary">
            <time datetime={date().toISOString()}>{date().format('YYYY-MM-DD HH:mm:ss')}</time>
          </div>
          <Menu />
        </div>
        <Editor memo={memoView} isReadonly={!memoView.uiState.isEditing} />
        <Tabs.Root lazyMount unmountOnExit onValueChange={action(handleTabChange)} value={memoView.uiState.tab}>
          <Operation />
          <FollowupList />
          <ReferrerList />
        </Tabs.Root>
        <RevisionModal />
      </div>
    </ContextProvider>
  );
}
