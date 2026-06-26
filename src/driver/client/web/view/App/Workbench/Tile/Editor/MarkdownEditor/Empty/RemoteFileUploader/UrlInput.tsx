import { onMount, Show } from 'solid-js';
import type Downloader from '#domain/client/app/model/Workbench/noteEditor/Uploader/Downloader';

export default function UrlInput(props: { remoteUploader: Downloader }) {
  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <div class="w-full flex flex-col items-center">
      <input
        ref={inputRef}
        class="w-full px-2 py-1 text-sm text-left rounded border border-border-primary bg-bg-primary text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:border-border-accent"
        placeholder="输入资源链接"
        onInput={(e) => props.remoteUploader.setUrl(e.target.value)}
      />
      <Show when={!props.remoteUploader.isValidUrl && !props.remoteUploader.isEmptyUrl}>
        <div class="text-xs text-fg-danger mt-1">URL 不合法</div>
      </Show>
    </div>
  );
}
