import { createMemo, Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import UrlInput from './UrlInput';
import DownloadingProgress from './DownloadingProgress';

import { useContext } from '../../../composables';
import { GlobeIcon } from 'lucide-solid';

export default function RemoteFileUploader(props: { className?: string }) {
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  function initDownloader() {
    if (editor().resourceManager?.downloader) {
      return;
    }
    editor().resourceManager?.initDownloader();
  }

  return (
    <div class={props.className}>
      <button
        class="w-full h-full cursor-pointer text-sm flex items-center justify-center flex-col"
        onClick={initDownloader}
      >
        <GlobeIcon class="size-10 mb-4 stroke-1" />
        <p>上传在线资源</p>
      </button>
      <Show when={editor().resourceManager?.downloader}>
        {(downloader) => (
          <>
            <Show when={downloader().download.isPending} fallback={<UrlInput remoteUploader={downloader()} />}>
              <DownloadingProgress downloader={downloader()} />
            </Show>
            <div>
              <button
                disabled={!downloader().isValidUrl || downloader().download.isPending || downloader().isChecking}
                onClick={() => downloader().download.mutate()}
              >
                {downloader().download.isPending ? '下载中...' : '下载'}
              </button>
              <button onClick={() => editor().resourceManager?.clearDownloader()}>取消</button>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
