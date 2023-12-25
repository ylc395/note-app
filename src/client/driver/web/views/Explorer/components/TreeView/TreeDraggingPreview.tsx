import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import ExplorerManager from '@domain/app/model/manager/ExplorerManager';

export default observer(function () {
  const { currentExplorer } = container.resolve(ExplorerManager);
  return currentExplorer.tree.selectedNodes.length > 0 && <span>{currentExplorer.tree.selectedNodes.length}</span>;
});
