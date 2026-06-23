import { createEffect, createSignal, Match, on, Show, Switch } from 'solid-js';
import { PinIcon, PinOffIcon } from 'lucide-solid';

import Button from '#web/view/components/Button';
import MarkdownPreviewer from './MarkdownPreviewer';
import PDFPreviewer from './PDFPreviewer';
import { MimeTypes } from '#domain/shared/model/file';
import { useContext } from '../context';

export default function EntityPreviewer(props: {
  isInitialFixed?: boolean;
  onFixedChange?: (isFixed: boolean) => void;
}) {
  const [isFixed, setIsFixed] = createSignal(props.isInitialFixed || false);
  const { entity } = useContext()!;

  createEffect(on(isFixed, (value) => props.onFixedChange?.(value)));

  function toggleFix() {
    setIsFixed(!isFixed());
  }

  return (
    <>
      <div class="relative flex items-center gap-2">
        <h2 class="text-fg-primary font-medium text-sm truncate flex-1">
          <Show when={entity?.value.isLoading}>加载中...</Show>
          <Show when={entity?.value.isError}>无法预览</Show>
          <Show when={entity?.value.isSuccess}>{entity?.title}</Show>
        </h2>
        <Show when={!entity?.value.isError}>
          <Button size="small" square onClick={toggleFix}>
            <Show when={isFixed()} fallback={<PinIcon class="size-4" />}>
              <PinOffIcon class="size-4" />
            </Show>
          </Button>
        </Show>
      </div>
      <Show when={entity?.blob.isLoading}>
        <div>加载中...</div>
      </Show>
      <Show when={entity?.value.isError || entity?.blob.isError}>
        <div>URL 指向的本地资源不存在</div>
      </Show>
      <Show when={entity?.value.isSuccess && !entity?.value.data?.mimeType}>
        <MarkdownPreviewer />
      </Show>
      <Show when={entity?.blob.isSuccess}>
        <Switch>
          <Match when={entity?.value.data?.mimeType === MimeTypes.PDF}>
            <PDFPreviewer />
          </Match>
        </Switch>
      </Show>
    </>
  );
}
