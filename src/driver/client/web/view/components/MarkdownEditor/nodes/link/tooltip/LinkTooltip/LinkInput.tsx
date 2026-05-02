import { cx } from 'class-variance-authority';
import { SquareArrowOutUpRightIcon } from 'lucide-solid';
import { createEffect, createSignal, on, Show } from 'solid-js';

import shell from '#web/infra/shell';
import { Mode } from './constant';
import { useContext } from './context';

export default function LinkInput(props: {
  mode: Mode;
  initialUrl: string;
  onInput: (url: string) => void;
  ref?: HTMLInputElement;
}) {
  const [url, setUrl] = createSignal(props.initialUrl);
  const { entity } = useContext()!;

  createEffect(on(url, props.onInput));

  function handleUrlClick() {
    if (props.mode !== Mode.Preview) {
      return;
    }

    if (entity.jump) {
      entity.jump();
    } else {
      shell.openNewWindow(url());
    }
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
        onInput={(e) => setUrl(e.target.value)}
        value={url()}
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
