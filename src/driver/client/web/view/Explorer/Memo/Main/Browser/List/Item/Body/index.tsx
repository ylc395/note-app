import { Show } from 'solid-js';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import Display from './Display';
import Editor from './Editor';

export default function Body(props: { memoView: MemoView }) {
  let rootRef: HTMLDivElement | undefined;

  return (
    <div class="py-4 relative" ref={rootRef}>
      <Show when={props.memoView.selfEditor} fallback={<Display memoView={props.memoView} />}>
        <Editor memoView={props.memoView} />
      </Show>
    </div>
  );
}
