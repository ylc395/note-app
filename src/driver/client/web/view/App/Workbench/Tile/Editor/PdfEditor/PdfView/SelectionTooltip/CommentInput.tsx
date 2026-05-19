import { onMount } from 'solid-js';

import Button from '#web/view/components/Button';
import Selection from './Selection';

export default function CommentInput(props: { selection: Selection }) {
  let editorRef: HTMLTextAreaElement | undefined;

  onMount(() => {
    editorRef?.focus();
  });

  return (
    <div class="mt-2 bg-surface-raised border border-border-primary rounded-lg shadow-lg p-3 z-50">
      <textarea
        ref={editorRef}
        class="w-full min-h-20 resize-y rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none focus:border-border-accent transition-colors"
        placeholder="添加注释..."
        onInput={(e) => props.selection.commentEditor.setContent(e.target.value)}
      />
      <div class="flex justify-end gap-2 mt-2">
        <Button size="small" onClick={props.selection.cancelComment.bind(props.selection)}>
          取消
        </Button>
        <Button size="small" intent="primary" onClick={props.selection.highlight.bind(props.selection)}>
          提交
        </Button>
      </div>
    </div>
  );
}
