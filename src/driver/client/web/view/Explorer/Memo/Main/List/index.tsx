import MemoView from '#domain/client/app/model/memo/MemoView';
import List from './List';

export default function MemoList({ memoView }: { memoView: MemoView }) {
  return <List memoView={memoView} />;
}
