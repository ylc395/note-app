import { Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import { useContext } from '../../context';

export default function RemoteFileUploader(props: { className?: string }) {
  const { editor } = useContext()!;
  assert(editor instanceof MarkdownEditor);

  return (
    <div class={props.className}>
      <Show when={editor.remoteUploader} fallback="上传在线资源">
        {(remoteUploader) => (
          <div>
            <input />
            <div>
              <button>下载</button>
              <button>取消</button>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
