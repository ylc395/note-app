import { createMemo, Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import Button from '#web/view/components/Button';
import { GlobeIcon } from 'lucide-solid';

import { useContext } from '../../../composables';
import styles from '../uploader.module.css';
import UrlInput from './UrlInput';
import DownloadingProgress from './DownloadingProgress';

export default function RemoteFileUploader() {
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
    <div class={styles.container}>
      <Show
        when={editor().resourceManager?.downloader}
        fallback={
          <button class={styles.trigger} onClick={initDownloader}>
            <GlobeIcon class={styles.triggerIcon} />
            <p class={styles.triggerTitle}>加载在线资源</p>
          </button>
        }
      >
        {(downloader) => (
          <div class={styles.content}>
            <Show when={downloader().download.isPending} fallback={<UrlInput remoteUploader={downloader()} />}>
              <DownloadingProgress downloader={downloader()} />
            </Show>
            <div class={styles.actions}>
              <Button onClick={() => editor().resourceManager?.clearDownloader()}>取消</Button>
              <Button
                disabled={!downloader().isValidUrl || downloader().download.isPending || downloader().isChecking}
                onClick={() => downloader().download.mutate()}
              >
                {downloader().download.isPending ? '下载中...' : '下载'}
              </Button>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
