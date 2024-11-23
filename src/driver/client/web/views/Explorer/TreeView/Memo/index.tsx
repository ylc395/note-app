import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Header from './Header';
import NewMemoEditor from './Editor';
import List from './List';
import ListView from '#domain/client/app/model/memo/ListView';

export default observer(function MemoExplorerView() {
  const { uiState, root } = container.resolve(ListView);

  return (
    <>
      <Header />
      {uiState.panel === 'editor' && root.newChildEditor && <NewMemoEditor isChild node={root} />}
      <List />
    </>
  );
});
