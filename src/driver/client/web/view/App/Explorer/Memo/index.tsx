import { onCleanup } from 'solid-js';

import MemoList from '#domain/client/app/model/memo/List';

import Main from './Main';
import SearchBox from './SearchBox';
import Header from '../Header';
import styles from '../explorer.module.css';
import { ContextProvider } from './context';

export default function MemoExplorer() {
  const memoList = new MemoList();
  memoList.activate();

  onCleanup(() => {
    memoList.deactivate();
  });

  return (
    <ContextProvider memoList={memoList}>
      <div class={styles.explorer}>
        <Header title="Memo" />
        <SearchBox />
        <Main />
      </div>
    </ContextProvider>
  );
}
