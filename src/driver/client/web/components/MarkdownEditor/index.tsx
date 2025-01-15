import { Crepe } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { onCleanup, onMount } from 'solid-js';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

export default function MarkdownEditor({
  defaultValue,
  onUpdate,
}: {
  defaultValue?: string;
  onUpdate?: (md: string) => void;
}) {
  let rootRef: HTMLDivElement | undefined;
  let crepe: Crepe | undefined;

  onMount(async () => {
    crepe = new Crepe({
      root: rootRef,
      defaultValue,
    });

    crepe.editor
      .config((ctx) => {
        if (onUpdate) {
          ctx.get(listenerCtx).markdownUpdated((_, markdown) => onUpdate(markdown));
        }
      })
      .use(listener);

    crepe.create();
  });

  onCleanup(() => {
    crepe?.destroy();
  });

  return <div ref={rootRef}></div>;
}
