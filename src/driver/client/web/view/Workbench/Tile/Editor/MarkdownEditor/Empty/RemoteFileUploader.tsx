import { createMemo, Match, Show, Switch } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import { useContext } from '../../context';
import { normalizeTitle } from '#domain/shared/model/note';

export default function RemoteFileUploader(props: { className?: string }) {
  const { editor } = useContext()!;
  assert(editor instanceof MarkdownEditor);

  const progress = createMemo(() =>
    editor.remoteUploader?.metadata?.size
      ? Math.max(Math.ceil((editor.remoteUploader.loadedSize / editor.remoteUploader.metadata.size) * 100), 1)
      : null,
  );

  return (
    <div class={props.className}>
      <div onClick={() => !editor.remoteUploader && editor.initRemoteUploader()}>上传在线资源</div>
      <Show when={editor.remoteUploader}>
        {(remoteUploader) => (
          <>
            <Switch
              fallback={
                <div class={props.className}>
                  <input class="border" onInput={(e) => remoteUploader().setUrl(e.target.value)} />
                  <Show when={!remoteUploader().isValidUrl && !remoteUploader().isEmptyUrl}>
                    <div>URL 不合法</div>
                  </Show>
                </div>
              }
            >
              <Match when={remoteUploader().loadedData}>
                <div>这里是预览界面</div>
                <Show when={remoteUploader().duplicatedNotes}>
                  <p>
                    该资源已经存在于<a>{normalizeTitle(remoteUploader().duplicatedNotes![0]!)}</a>
                    {remoteUploader().duplicatedNotes!.length > 1 &&
                      `等${editor.localUploader!.duplicatedNotes!.length}个笔记`}
                    中。
                  </p>
                  <p>是否仍然创建？</p>
                </Show>
              </Match>
              <Match when={remoteUploader().isDownloading}>
                <div>
                  <span>{remoteUploader().metadata?.mimeType || '-'}</span>
                  <span>
                    已下载 {progress() ? `${progress()}%` : remoteUploader().loadedSize}
                    <Show when={remoteUploader().metadata?.size}>{(size) => `（共${size()}）`}</Show>
                  </span>
                </div>
              </Match>
            </Switch>
            <div>
              <Show
                when={remoteUploader().loadedData}
                fallback={
                  <button
                    disabled={!remoteUploader().isValidUrl || remoteUploader().isDownloading}
                    onClick={() => remoteUploader().download()}
                  >
                    {remoteUploader().isDownloading ? '下载中...' : '下载'}
                  </button>
                }
              >
                <button onClick={() => remoteUploader().upload()}>确认</button>
              </Show>
              <button onClick={editor.resetUploader}>取消</button>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
