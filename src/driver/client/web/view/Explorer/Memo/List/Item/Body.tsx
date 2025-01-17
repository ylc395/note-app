import { Show } from 'solid-js';
import { micromark } from 'micromark';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import MarkdownEditor from '#web/components/MarkdownEditor';

export default function Body({ node }: { node: MemoView }) {
  let rootRef: HTMLDivElement | undefined;

  return (
    <div class="mt-2 w-full relative" ref={rootRef} ondblclick={node.startEditing.bind(node)}>
      <Show when={node.selfEditor} fallback={<div innerHTML={micromark(node.value!.body)} />}>
        <MarkdownEditor
          onUpdate={(value) => node.selfEditor!.update(value)}
          defaultValue={node.value!.body}
          rootClass="!p-0"
          focusWhenEditable
        />
        <div>
          <button onclick={() => node.selfEditor!.submit()}>submit</button>
          <button onclick={() => node.selfEditor!.destroy()}>cancel</button>
        </div>
      </Show>
    </div>
  );
}
