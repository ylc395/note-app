import { createMemo, Show } from 'solid-js';
import type RemoteUploader from '#domain/client/app/model/note/editor/MarkdownEditor/RemoteUploader';

export default function DownloadingProgress(props: { remoteUploader: RemoteUploader }) {
  const progress = createMemo(() =>
    props.remoteUploader?.metadata?.size
      ? Math.max(Math.ceil((props.remoteUploader.loadedSize / props.remoteUploader.metadata.size) * 100), 1)
      : null,
  );

  return (
    <div>
      <span>{props.remoteUploader.metadata?.mimeType || '-'}</span>
      <span>
        已下载 {progress() ? `${progress()}%` : props.remoteUploader.loadedSize}
        <Show when={props.remoteUploader.metadata?.size}>{(size) => `（共${size()}）`}</Show>
      </span>
    </div>
  );
}
