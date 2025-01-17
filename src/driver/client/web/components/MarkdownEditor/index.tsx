import assert from 'assert';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, editorViewOptionsCtx } from '@milkdown/kit/core';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

export default function MarkdownEditor(props: {
  readonly?: boolean;
  rootClass?: string;

  /** 以下 prop 不具有响应性 */
  defaultValue?: string;
  onUpdate?: (md: string) => void;
  onCreated?: (editor: Crepe) => void;
  focusWhenEditable?: boolean;
}) {
  let rootRef: HTMLDivElement | undefined;
  const [getCrepe, setCrepe] = createSignal<Crepe>();

  onMount(() => {
    const { defaultValue, onUpdate } = props;
    const crepe = new Crepe({
      root: rootRef,
      defaultValue,
      features: { [Crepe.Feature.BlockEdit]: false },
    });

    if (onUpdate) {
      crepe.on((listener) => listener.markdownUpdated((_, markdown) => onUpdate(markdown)));
    }

    setCrepe(crepe);
  });

  createEffect(async () => {
    const crepe = getCrepe();
    const { rootClass } = props;

    assert(crepe, 'no crepe');

    if (rootClass) {
      crepe.editor.config((ctx) => {
        ctx.update(editorViewOptionsCtx, (prev) => ({ ...prev, attributes: { class: rootClass } }));
      });
    }

    const isReadonly = props.readonly;
    crepe.setReadonly(isReadonly ?? false);

    await crepe.create();
    props.onCreated?.(crepe);

    if (props.focusWhenEditable && !isReadonly) {
      crepe.editor.action((ctx) => ctx.get(editorViewCtx).focus());
    }
  });

  onCleanup(() => {
    getCrepe()?.destroy();
  });

  return <div ref={rootRef}></div>;
}
