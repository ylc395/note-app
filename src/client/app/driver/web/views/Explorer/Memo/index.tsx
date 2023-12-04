import List from './TreeView';
import Operations from './Operations';
import ExplorerHeader from '../components/ExplorerHeader';
import { container } from 'tsyringe';
import Explorer from '@domain/model/Explorer';

// eslint-disable-next-line mobx/missing-observer
export default function MemoExplorer() {
  const { materialTree } = container.resolve(Explorer);
  return (
    <>
      <ExplorerHeader tree={materialTree} title="思考碎片">
        <Operations />
      </ExplorerHeader>
      <List />
    </>
  );
}
