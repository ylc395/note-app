import { Link2Icon, ReplyIcon } from 'lucide-solid';
import type MemoView from '#domain/client/app/model/memo/MemoView';
import assert from 'assert';

export default function Operation({ memoView }: { memoView: MemoView }) {
  assert(memoView.value, 'no value');

  return (
    <div class="flex border-t">
      <button class="flex grow justify-center items-center border-r">
        <Link2Icon /> Referrers
        <span class="ml-2">{memoView.value.referrersCount}</span>
      </button>
      <button class="flex grow justify-center items-center" onclick={memoView.toggleFollowup.bind(memoView)}>
        <ReplyIcon /> Follow-up
        <span class="ml-2">{memoView.value.childrenCount}</span>
      </button>
    </div>
  );
}
