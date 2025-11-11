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
      <SearchBox />
      <Tabs.Root
        unmountOnExit
        lazyMount
        onValueChange={(e) => setTabValue(e.value as TabsValue)}
        value={searcher.keyword ? tabValue() : TabsValue.All}
      >
        <Show when={searcher.keyword}>
          <Tabs.List>
            <Tabs.Trigger value={TabsValue.All}>全部</Tabs.Trigger>
            <Tabs.Trigger value={TabsValue.SearchResult}>搜索结果</Tabs.Trigger>
          </Tabs.List>
        </Show>
        <Tabs.Content value={TabsValue.All}>
          <TreeView />
        </Tabs.Content>
        <Tabs.Content value={TabsValue.SearchResult}>
          <SearchResult />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
