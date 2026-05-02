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
        <Show when={entity.title()}>
          <h2 class="text-fg-primary font-medium text-sm truncate flex-1">{entity.title()}</h2>
        </Show>
        <Button size="small" square onClick={toggleFix}>
          <Show when={isFixed()} fallback={<PinIcon class="size-4" />}>
            <PinOffIcon class="size-4" />
          </Show>
        </Button>
      </div>
      <Switch fallback={<MarkdownPreviewer />}>
        <Match when={entity.mimeType() === MimeTypes.PDF}>
          <PDFPreviewer />
        </Match>
      </Switch>
    </>
  );
}
