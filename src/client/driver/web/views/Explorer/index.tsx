import ActivityBar from './ActivityBar';
import TreeView from './TreeView';

// eslint-disable-next-line mobx/missing-observer
export default (function ExplorerView() {
  return (
    <div className="flex h-full overflow-x-hidden border-0 border-r border-solid border-common">
      <ActivityBar />
      <TreeView />
    </div>
  );
});
