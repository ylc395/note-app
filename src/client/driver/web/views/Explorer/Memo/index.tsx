import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import MemoService from '@domain/app/service/MemoService';
import Header from './Header';
import NewMemoEditor from './Editor';
import List from './List';

export default observer(function MemoExplorerView() {
  const {
    explorer: { uiState },
  } = container.resolve(MemoService);

  return (
    <>
      <Header />
      {uiState.panel === 'editor' && <NewMemoEditor />}
      <List />
    </>
  );
});
