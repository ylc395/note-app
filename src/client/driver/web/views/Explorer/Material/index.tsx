import { observer } from 'mobx-react-lite';
import Sidebar from './Sidebar';
import List from './List';

export default observer(function MaterialExplorer() {
  return (
    <div className="flex">
      <Sidebar />
      <List />
    </div>
  );
});
