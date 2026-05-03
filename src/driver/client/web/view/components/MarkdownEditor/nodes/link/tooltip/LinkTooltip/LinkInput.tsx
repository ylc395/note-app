import { cx } from 'class-variance-authority';
import { SquareArrowOutUpRightIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import shell from '#web/infra/shell';
import { Mode } from './constant';
import { useContext } from './context';

export default function LinkInput(props: {
  mode: Mode;
  value: string;
  onInput: (url: string) => void;
  ref?: HTMLInputElement;
}) {
  const { entity } = useContext()!;

  function handleUrlClick() {
    if (props.mode !== Mode.Preview) {
      return;
    }

    if (entity.jump) {
      entity.jump();
    } else {
      shell.openNewWindow(props.value);
    }
  }

  return (
    <div
      class="flex items-center gap-1 border border-border-primary rounded px-2 py-1 text-sm"
      classList={{ 'cursor-pointer': props.mode === Mode.Preview }}
      onClick={handleUrlClick}
    >
      <Show
        when={entity.entitySource?.path.isSuccess && props.mode === Mode.Preview}
        fallback={
          <input
            placeholder="URL"
            ref={props.ref}
            readOnly={props.mode === Mode.Preview}
            onInput={(e) => props.onInput(e.target.value)}
            value={props.value}
            class={cx(
              'bg-transparent text-fg-primary placeholder:text-fg-tertiary outline-none w-full',
              props.mode === Mode.Preview && 'cursor-pointer hover:underline',
            )}
          />
        }
      >
        <div>
          {[...entity.entitySource!.path.data!, { title: entity.entitySource?.title }].map((p) => p.title).join('/')}
        </div>
      </Show>
      <Show
        when={props.mode === Mode.Preview && !entity.entitySource?.value.isError && !entity.entitySource?.path.isError}
      >
        <SquareArrowOutUpRightIcon class="size-4 text-fg-secondary shrink-0" />
      </Show>
    </div>
  );
}
