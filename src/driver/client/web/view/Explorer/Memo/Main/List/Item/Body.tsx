import { Show } from 'solid-js';
import { micromark } from 'micromark';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import MarkdownEditor from '#web/components/MarkdownEditor';

export default function Body({ memoView }: { memoView: MemoView }) {
  let rootRef: HTMLDivElement | undefined;

  return (
    <div class="w-full py-4 relative" ref={rootRef}>
      <Show
        when={memoView.selfEditor}
        fallback={
          <div
            class="select-text text-gray-800"
            ondblclick={memoView.startEditing.bind(memoView)}
            innerHTML={micromark(memoView.value!.body)}
          />
        }
      >
        <MarkdownEditor
          onUpdate={(value) => memoView.selfEditor!.update(value)}
          defaultValue={memoView.value!.body}
          rootClass="!p-0 max-h-60 overflow-auto w-full"
          focusWhenEditable
        />
        <div class="flex justify-end space-x-2 mt-2">
          <button class="text-sm text-gray-400" onclick={() => memoView.selfEditor!.destroy()}>
            取消
          </button>
          <button class="text-sm text-gray-400" onclick={() => memoView.selfEditor!.submit()}>
            提交
          </button>
        </div>
      </Show>
    </div>
  );
}
