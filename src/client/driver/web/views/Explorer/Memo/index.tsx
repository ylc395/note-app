import { observer } from 'mobx-react-lite';

import ExplorerHeader from '../common/ExplorerHeader';

export default observer(function MemoExplorerView() {
  return (
    <>
      <ExplorerHeader right={[]} left={[]} title="Memo" />
    </>
  );
});
