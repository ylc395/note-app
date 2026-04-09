import { createEffect, createSignal, on, Show } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

import TreeView from './TreeView';
import DropArea from './DropArea';
import Header from '../Header';
import SearchBox from './SearchBox';
import SearchResult from './SearchResult';

enum TabsValue {
  All = 'all',
  SearchResult = 'searchResult',
}

export default function NoteExplorer(props: { className: string }) {
  const searcher = container.resolve(Searcher);
  const [tabValue, setTabValue] = createSignal<TabsValue>(TabsValue.All);

  createEffect(
    on(
      () => searcher.keyword,
      (keyword) => {
        if (keyword && tabValue() !== TabsValue.SearchResult) {
          setTabValue(TabsValue.SearchResult);
        }
      },
    ),
  );

  return (
    <div class={props.className}>
      <Header title="笔记">
        <DropArea />
      </Header>
      <SearchBox onSearchManually={() => setTabValue(TabsValue.SearchResult)} />
      <Tabs.Root
        unmountOnExit
        class="min-h-0 flex flex-col grow"
        lazyMount
        onValueChange={(e) => setTabValue(e.value as TabsValue)}
        value={searcher.keyword ? tabValue() : TabsValue.All}
      >
        <Show when={searcher.keyword}>
          <Tabs.List class="text-sm mt-4 rounded-lg w-fit mx-auto bg-bg-primary text-fg-secondary">
            <Tabs.Trigger class="w-[5em] py-1 data-[selected]:text-fg-primary" value={TabsValue.All}>
              全部
            </Tabs.Trigger>
            <Tabs.Trigger
              class="w-[5em] py-1 data-[selected]:text-fg-primary"
              value={TabsValue.SearchResult}
            >
              搜索结果
            </Tabs.Trigger>
          </Tabs.List>
        </Show>
        <Tabs.Content class="mt-4 min-h-0 flex flex-col grow" value={TabsValue.All}>
          <TreeView />
        </Tabs.Content>
        <Tabs.Content class="mt-4 min-h-0 flex flex-col grow" value={TabsValue.SearchResult}>
          <SearchResult />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
