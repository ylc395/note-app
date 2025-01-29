import type MemoView from '#domain/client/app/model/memo/MemoView';
import Editor from '../../Editor';
import List from '../List';

export default function FollowupList({ memoView }: { memoView: MemoView }) {
  return (
    <div>
      <Editor editor={memoView.newEditor!} />
      <List memoView={memoView} />
    </div>
  );
}
