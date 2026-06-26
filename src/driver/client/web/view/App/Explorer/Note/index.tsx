import { createEffect, on, Show } from 'solid-js';
import { Tabs } from '@ark-ui/solid';
import { action } from 'mobx';

import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

import TreeView from './TreeView';
import DropArea from './DropArea';
import Header from '../Header';
import SearchResult from './SearchResult';
import UIState, { NoteTabs } from '../../UIState';
import SearchBox from './SearchBox';
import styles from '../explorer.module.css';

export default function NoteExplorer() {
  const searcher = container.resolve(Searcher);
  const uiState = container.resolve(UIState);

  const setTab = action((tab: NoteTabs) => {
    uiState.explorer.noteExplorer.tab = tab;
  });

  createEffect(
    on(
      () => searcher.keyword,
      (keyword) => setTab(keyword ? NoteTabs.SearchResult : NoteTabs.All),
    ),
  );

  return (
    <div class={styles.explorer}>
      <Header title="笔记">
        <DropArea />
      </Header>
      <SearchBox />
      <Tabs.Root
        unmountOnExit
        class="min-h-0 flex flex-col grow"
        lazyMount
        onValueChange={(e) => setTab(e.value as NoteTabs)}
        value={uiState.explorer.noteExplorer.tab}
      >
        <Show when={searcher.keyword}>
          <Tabs.List class="flex text-sm rounded-lg w-fit mx-auto p-0.5 bg-bg-tertiary text-fg-secondary mb-4">
            <Tabs.Trigger
              class="w-[5em] py-1 rounded-md text-center transition-colors hover:text-fg-primary data-[selected]:bg-bg-primary data-[selected]:text-fg-primary data-[selected]:shadow-sm"
              value={NoteTabs.All}
            >
              全部
            </Tabs.Trigger>
            <Tabs.Trigger
              class="w-[5em] py-1 rounded-md text-center transition-colors hover:text-fg-primary data-[selected]:bg-bg-primary data-[selected]:text-fg-primary data-[selected]:shadow-sm"
              value={NoteTabs.SearchResult}
            >
              搜索结果
            </Tabs.Trigger>
          </Tabs.List>
        </Show>
        <Tabs.Content class="min-h-0 flex flex-col grow" value={NoteTabs.All}>
          <TreeView />
        </Tabs.Content>
        <Tabs.Content class="min-h-0 flex flex-col grow" value={NoteTabs.SearchResult}>
          <SearchResult />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
