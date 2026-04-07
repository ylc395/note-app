import { createMemo, Show } from 'solid-js';
import type Downloader from '#domain/client/app/model/note/editor/Uploader/Downloader';

export default function DownloadingProgress(props: { downloader: Downloader }) {
  const progress = createMemo(() =>
    props.downloader?.metadata.result.data?.size
      ? Math.max(Math.ceil(props.downloader.loadedSize / props.downloader.metadata.result.data.size) * 100, 1)
      : null,
  );

  return (
    <div>
      <span>{props.downloader.metadata.result.data?.mimeType || '-'}</span>
      <span>
        已下载 {progress() ? `${progress()}%` : props.downloader.loadedSize}
        <Show when={props.downloader.metadata.result.data?.size}>{(size) => `（共${size()}）`}</Show>
      </span>
    </div>
  );
}
