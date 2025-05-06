import { MessageSquareIcon } from 'lucide-solid';
import { onCleanup, onMount } from 'solid-js';
import { autoUpdate, computePosition, offset } from '@floating-ui/dom';
import { Popover, PopoverContent } from '@ark-ui/solid';

import type { AnnotationVO } from '#domain/shared/model/annotation';

export default function AnnotationMark(props: { annotation: AnnotationVO; markEl: HTMLElement }) {
  let buttonRef: HTMLButtonElement | undefined;

  onMount(() => {
    const stopAutoUpdate = autoUpdate(props.markEl, buttonRef!, () => {
      computePosition(props.markEl, buttonRef!, {
        placement: 'right-start',
        middleware: [offset(5)],
      }).then(({ x, y }) => {
        Object.assign(buttonRef!.style, { left: `${x}px`, top: `${y}px` });
      });
    });

    onCleanup(stopAutoUpdate);
  });

  return (
    <Popover.Root
      positioning={{
        placement: 'right-start',
      }}
    >
      <Popover.Trigger ref={buttonRef} class="absolute cursor-pointer flex">
        <MessageSquareIcon />
      </Popover.Trigger>
      <Popover.Positioner>
        <PopoverContent class="w-64 bg-gray-200 ml-1 p-2">{props.annotation.body}</PopoverContent>
      </Popover.Positioner>
    </Popover.Root>
  );
}
