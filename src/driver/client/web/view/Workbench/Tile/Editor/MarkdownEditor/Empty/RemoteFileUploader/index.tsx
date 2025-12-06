import { Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import UrlInput from './UrlInput';
import DownloadingProgress from './DownloadingProgress';

import { useContext } from '../../../context';

export default function RemoteFileUploader(props: { className?: string }) {
  const { editor } = useContext()!;
  assert(editor instanceof MarkdownEditor);

  function initDownloader() {
    if (editor.fileUploader?.downloader) {
      return;
    }
    editor.fileUploader?.initDownloader();
  }

  return (
    <div class={props.className}>
      <div onClick={initDownloader}>上传在线资源</div>
      <Show when={editor.fileUploader?.downloader}>
        {(downloader) => (
          <>
            <Show when={downloader().isDownloading} fallback={<UrlInput remoteUploader={downloader()} />}>
              <DownloadingProgress downloader={downloader()} />
            </Show>
            <div>
              <button
                disabled={!downloader().isValidUrl || downloader().isDownloading || downloader().isChecking}
                onClick={() => downloader().download()}
              >
                {downloader().isDownloading ? '下载中...' : '下载'}
              </button>
              <button onClick={() => editor.fileUploader?.clearDownloader()}>取消</button>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
