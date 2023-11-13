import List from './TreeView';
import Operations from './Operations';
import ExplorerHeader from '../components/ExplorerHeader';

// eslint-disable-next-line mobx/missing-observer
export default function MemoExplorer() {
  return (
    <>
      <ExplorerHeader title="思考碎片">
        <Operations />
      </ExplorerHeader>
      <List />
    </>
  );
}
