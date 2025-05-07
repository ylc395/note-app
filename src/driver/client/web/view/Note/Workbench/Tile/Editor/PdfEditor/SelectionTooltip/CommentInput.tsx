import { onMount } from 'solid-js';
import Selection from './Selection';

export default function CommentInput(props: { selection: Selection }) {
  let editorRef: HTMLTextAreaElement | undefined;

  onMount(() => {
    editorRef?.focus();
  });

  function cancel() {
    props.selection.closeCommentEditor();
  }

  return (
    <div>
      <textarea ref={editorRef} onInput={(e) => props.selection.setCommentContent(e.target.value)}></textarea>
      <div>
        <button onClick={cancel}>取消</button>
        <button onClick={() => props.selection.highlight()}>提交</button>
      </div>
    </div>
  );
}
