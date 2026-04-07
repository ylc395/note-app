import { Key } from '@solid-primitives/keyed';
import type MemoView from '#domain/client/app/model/memo/MemoView';

import Editor from '../../Editor';
import Item from './index';

export default function FollowupList({ memoView }: { memoView: MemoView }) {
  return (
    <div>
      <Editor editor={memoView.newEditor!} />
      <div>
        <Key each={memoView.childrenQuery.result.data} by="id">
          {(item) => <Item memo={item()} />}
        </Key>
      </div>
    </div>
  );
}
