import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Header from './Header';
import NewMemoEditor from './Editor';
import List from './List';
import MemoExplorer from '#domain/client/app/model/memo/Explorer';

export default observer(function MemoExplorerView() {
  const { uiState, root } = container.resolve(MemoExplorer);

  return (
    <>
      <Header />
      {uiState.panel === 'editor' && root.newChildEditor && <NewMemoEditor isChild node={root} />}
      <List />
    </>
  );
});
