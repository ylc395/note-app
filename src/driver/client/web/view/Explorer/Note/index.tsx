import { Show } from 'solid-js';
import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

import TreeView from './TreeView';
import DropArea from './DropArea';
import Header from '../Header';
import SearchBox from './SearchBox';
import SearchResult from './SearchResult';

export default function NoteExplorer(props: { className: string }) {
  const searcher = container.resolve(Searcher);

  return (
    <div class={props.className}>
      <Header title="笔记">
        <DropArea />
      </Header>
      <SearchBox />
      <Show when={searcher.result} fallback={<TreeView />}>
        <SearchResult />
      </Show>
    </div>
  );
}
