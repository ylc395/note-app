import { onCleanup, onMount, Show } from 'solid-js';
import { MessageSquareMoreIcon, PaintbrushIcon } from 'lucide-solid';

import Button from '#web/view/components/Button';
import CommentInput from './CommentInput';
import ColorPicker from './ColorPicker';
import Selection from './Selection';
import { useContext } from '../../context';

export default function SelectionTooltip() {
  const { viewer } = useContext()!;
  let rootEl: HTMLDivElement | undefined;
  const selection = new Selection(viewer); // selection 的生命周期比组件长，和 editor 保持一致

  onMount(() => {
    selection.init(rootEl!);
  });

  onCleanup(() => {
    selection.destroy();
  });

  return (
    <div ref={rootEl} class="absolute">
      <Show when={selection.isVisible && !selection.commentEditor.isOpen}>
        <div class="flex gap-1 bg-surface-raised border border-border-primary py-1.5 px-1.5 rounded-lg shadow-lg z-50">
          <ColorPicker selection={selection} />
          <Button square size="md" onClick={selection.startComment.bind(selection)}>
            <MessageSquareMoreIcon />
          </Button>
          <Button square size="md" onClick={selection.highlight.bind(selection)}>
            <PaintbrushIcon />
          </Button>
        </div>
      </Show>
      <Show when={selection.commentEditor.isOpen}>
        <CommentInput commentEditor={selection.commentEditor} />
      </Show>
    </div>
  );
}
