import { For } from 'solid-js';
import MemoView from '#domain/client/app/model/memo/MemoView';
import Item from './Item';

export default function MemoList({ node }: { node: MemoView }) {
  return (
    <div class="space-y-6 px-4">
      <For each={node.children || []}>{(item) => <Item value={item} />}</For>
    </div>
  );
}
