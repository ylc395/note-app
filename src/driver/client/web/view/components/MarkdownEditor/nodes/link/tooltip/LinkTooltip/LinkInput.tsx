import { cx } from 'class-variance-authority';
import { SquareArrowOutUpRightIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import shell from '#web/infra/shell';
import { Mode } from './constant';

export default function LinkInput(props: {
  mode: Mode;
  url: string;
  onInput: (url: string) => void;
  ref?: HTMLInputElement;
}) {
  function handleUrlClick() {
    if (props.mode !== Mode.Preview) {
      return;
    }

    shell.openNewWindow(props.url);
  }

  return (
    <div
      class="flex items-center gap-1 border border-border-primary rounded px-2 py-1 text-sm"
      classList={{ 'cursor-pointer': props.mode === Mode.Preview }}
    >
      <input
        placeholder="URL"
        ref={props.ref}
        readOnly={props.mode === Mode.Preview}
        onInput={(e) => props.onInput(e.target.value)}
        value={props.url}
        class={cx(
          'bg-transparent text-fg-primary placeholder:text-fg-tertiary outline-none w-full',
          props.mode === Mode.Preview && 'cursor-pointer hover:underline',
        )}
        onClick={handleUrlClick}
      />
      <Show when={props.mode === Mode.Preview}>
        <SquareArrowOutUpRightIcon class="size-4 text-fg-secondary shrink-0" />
      </Show>
    </div>
  );
}
