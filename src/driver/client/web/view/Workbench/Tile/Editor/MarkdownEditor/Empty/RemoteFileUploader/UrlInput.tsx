import { Show } from 'solid-js';
import type Downloader from '#domain/client/app/model/note/editor/Uploader/Downloader';

export default function UrlInput(props: { remoteUploader: Downloader }) {
  return (
    <div>
      <input class="border" onInput={(e) => props.remoteUploader.setUrl(e.target.value)} />
      <Show when={!props.remoteUploader.isValidUrl && !props.remoteUploader.isEmptyUrl}>
        <div>URL 不合法</div>
      </Show>
    </div>
  );
}
