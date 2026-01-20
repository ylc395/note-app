import { SquareIcon, SquareCheck } from 'lucide-solid';
import { Show } from 'solid-js';

export default function View(props: { checked: boolean; onToggle: (value: boolean) => void }) {
  const iconProps = {
    onClick,
    class: 'cursor-pointer',
  };

  function onClick(e: MouseEvent) {
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
