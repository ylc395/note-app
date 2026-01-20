import { editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { SquareIcon, SquareCheck } from 'lucide-solid';
import { Show } from 'solid-js';

export default function View(props: { ctx: Ctx; checked: boolean; onToggle: (value: boolean) => void }) {
  const iconProps = {
    onClick,
    class: 'cursor-pointer',
  };

  function onClick(e: MouseEvent) {
    if (!props.ctx.get(editorViewCtx).editable) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    props.onToggle(!props.checked);
  }

  return (
    <Show when={props.checked} fallback={<SquareIcon {...iconProps} />}>
      <SquareCheck {...iconProps} />
    </Show>
  );
}
