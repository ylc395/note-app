import { Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import UrlInput from './UrlInput';
import DownloadingProgress from './DownloadingProgress';

import { useContext } from '../../../context';

export default function RemoteFileUploader(props: { className?: string }) {
  const { editor } = useContext()!;
  assert(editor instanceof MarkdownEditor);

  return (
    <div class={props.className}>
      <div onClick={() => !editor.remoteUploader && editor.initRemoteUploader()}>上传在线资源</div>
      <Show when={editor.remoteUploader}>
        {(remoteUploader) => (
          <>
            <Show when={remoteUploader().isDownloading} fallback={<UrlInput remoteUploader={remoteUploader()} />}>
              <DownloadingProgress remoteUploader={remoteUploader()} />
            </Show>
            <div>
              <button
                disabled={!remoteUploader().isValidUrl || remoteUploader().isDownloading}
                onClick={() => remoteUploader().download()}
              >
                {remoteUploader().isDownloading ? '下载中...' : '下载'}
              </button>
              <button onClick={editor.resetUploader}>取消</button>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
