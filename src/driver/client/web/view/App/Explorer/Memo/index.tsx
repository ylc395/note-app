import { onCleanup } from 'solid-js';

import container from '#utils/singletonContainer';
import MemoList from '#domain/client/app/model/memo/List';

import Main from './Main';
import SearchBox from './SearchBox';
import Header from '../Header';
import styles from '../explorer.module.css';

export default function MemoExplorer() {
  const memoList = container.resolve(MemoList);
  memoList.setActive(true);

  onCleanup(() => {
    memoList.setActive(false);
  });

  return (
    <div class={styles.explorer}>
      <Header title="Memo" />
      <SearchBox />
      <Main />
    </div>
  );
}
