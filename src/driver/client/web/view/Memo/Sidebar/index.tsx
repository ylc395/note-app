import { action } from 'mobx';
import { PanelLeftClose } from 'lucide-solid';
import { Splitter } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';
import Calender from './Calendar';
import TopicList from './TopicList';
import SearchBox from './SearchBox';
import LinkSelector from './LinkSelector';
import { Show } from 'solid-js';
import UIState from '#web/view/UIState';

export default function Sidebar() {
  const {
    filter: { linkSelector, topicList },
  } = container.resolve(MemoList);
  const uiState = container.resolve(UIState);

  return (
    <div
      onclick={action(() => uiState.update({ 'memo.sidebarVisibility': 'visible' }))}
      class={`${uiState.value?.['memo.sidebarVisibility'] === 'always' ? '' : 'hidden'}
        ${uiState.value?.['memo.sidebarVisibility'] === 'hidden' ? 'md:hidden' : 'md:block'}
        z-10 inset-0 bg-transparent absolute min-w-0 shrink-0 border-r pr-4 mr-4 opacity-80
        md:static md:z-0 md:opacity-100`}
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="w-fit h-full overflow-auto shadow-md bg-gray-50 p-4 md:shadow-none md:p-0 flex flex-col relative"
      >
        <div class="flex sticky z-10 bg-gray-50 top-0 items-center pb-4 justify-between">
          <h1 class="font-semibold">MEMO</h1>
          <button class="text-gray-300" onClick={action(() => uiState.update({ 'memo.sidebarVisibility': 'hidden' }))}>
            <PanelLeftClose />
          </button>
        </div>
        <SearchBox />
        <Calender />
        <Splitter.Root
          orientation="vertical"
          class="min-h-60"
          defaultSize={
            (uiState.value?.['memo.filter.proportion'] as Splitter.RootProps['defaultSize']) ?? [
              { id: 'linkSelector', size: 50 },
              { id: 'topicList', size: 50 },
            ]
          }
          onSizeChangeEnd={(e) => uiState.update({ 'memo.filter.proportion': e.size })}
        >
          <LinkSelector />
          <Show when={linkSelector.hasContent && topicList.hasContent}>
            <Splitter.ResizeTrigger id="linkSelector:topicList" class="h-1" />
          </Show>
          <TopicList />
        </Splitter.Root>
      </div>
    </div>
  );
}
