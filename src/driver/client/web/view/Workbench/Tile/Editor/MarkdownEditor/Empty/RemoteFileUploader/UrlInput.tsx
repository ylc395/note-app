import { Show } from 'solid-js';
import type RemoteUploader from '#domain/client/app/model/note/editor/MarkdownEditor/RemoteUploader';

export default function UrlInput(props: { remoteUploader: RemoteUploader }) {
  return (
    <div>
      <input class="border" onInput={(e) => props.remoteUploader.setUrl(e.target.value)} />
      <Show when={!props.remoteUploader.isValidUrl && !props.remoteUploader.isEmptyUrl}>
        <div>URL 不合法</div>
      </Show>
    </div>
  );
}
