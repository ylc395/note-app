import { Show } from 'solid-js';
import { micromark } from 'micromark';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import MarkdownEditor from '#web/components/MarkdownEditor';

export default function Body({ memoView }: { memoView: MemoView }) {
  let rootRef: HTMLDivElement | undefined;

  return (
    <div class="w-full py-4 relative" ref={rootRef} ondblclick={memoView.startEditing.bind(memoView)}>
      <Show
        when={memoView.selfEditor}
        fallback={<div class="select-text" innerHTML={micromark(memoView.value!.body)} />}
      >
        <MarkdownEditor
          onUpdate={(value) => memoView.selfEditor!.update(value)}
          defaultValue={memoView.value!.body}
          rootClass="!p-0"
          focusWhenEditable
        />
        <div>
          <button onclick={() => memoView.selfEditor!.submit()}>submit</button>
          <button onclick={() => memoView.selfEditor!.destroy()}>cancel</button>
        </div>
      </Show>
    </div>
  );
}
