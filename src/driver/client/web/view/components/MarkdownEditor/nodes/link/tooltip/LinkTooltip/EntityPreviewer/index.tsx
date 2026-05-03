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
  const { entity } = useContext()!;
  const [isFixed, setIsFixed] = createSignal(props.isInitialFixed || false);

  createEffect(on(isFixed, (value) => props.onFixedChange?.(value)));

  function toggleFix() {
    setIsFixed(!isFixed());
  }

  return (
    <>
      <div class="relative flex items-center gap-2">
        <h2 class="text-fg-primary font-medium text-sm truncate flex-1">
          <Show when={entity.entitySource?.value.isLoading}>加载中...</Show>
          <Show when={entity.entitySource?.value.isError}>无法预览</Show>
          <Show when={entity.entitySource?.value.isSuccess}>{entity.entitySource?.title}</Show>
        </h2>
        <Button size="small" square onClick={toggleFix}>
          <Show when={isFixed()} fallback={<PinIcon class="size-4" />}>
            <PinOffIcon class="size-4" />
          </Show>
        </Button>
      </div>
      <Show when={entity.entitySource?.blob.isLoading}>
        <div>加载中...</div>
      </Show>
      <Show when={entity.entitySource?.value.isError || entity.entitySource?.blob.isError}>
        <div>URL 指向的本地资源不存在</div>
      </Show>
      <Show when={entity.entitySource?.value.isSuccess && !entity.entitySource?.value.data?.mimeType}>
        <MarkdownPreviewer />
      </Show>
      <Show when={entity.entitySource?.blob.isSuccess}>
        <Switch>
          <Match when={entity.mimeType() === MimeTypes.PDF}>
            <PDFPreviewer />
          </Match>
        </Switch>
      </Show>
    </>
  );
}
