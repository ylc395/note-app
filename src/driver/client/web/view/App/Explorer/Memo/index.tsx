import { onCleanup } from 'solid-js';

import container from '#utils/singletonContainer';
import MemoList from '#domain/client/app/model/memo/List';

import Main from './Main';
import SearchBox from './SearchBox';
import Header from '../Header';

export default function MemoExplorer(props: { className: string }) {
  const memoList = container.resolve(MemoList);
  memoList.setActive(true);

  onCleanup(() => {
    memoList.setActive(false);
  });

  return (
    <div class={props.className}>
      <Header title="Memo" />
      <SearchBox />
      <Main />
    </div>
  );
}
