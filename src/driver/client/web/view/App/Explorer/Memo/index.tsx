import MemoList from '#domain/client/app/model/memo/List';

import SearchBox from './SearchBox';
import Header from '../Header';
import { ContextProvider } from './context';
import Editor from './Editor';
import List from './List';
import ListToolbar from './ListToolBar';
import styles from '../shared/explorer.module.css';

export default function MemoExplorer() {
  const memoList = new MemoList();

  return (
    <ContextProvider memoList={memoList}>
      <div class={styles.explorer}>
        <Header title="Memo" />
        <SearchBox />
        <Editor appendMemo={memoList} />
        <div class="relative flex flex-col min-h-0">
          <ListToolbar />
          <List />
        </div>
      </div>
    </ContextProvider>
  );
}
