import { createEffect, onCleanup } from 'solid-js';
import { defaultValueCtx, editorViewOptionsCtx, Editor as MilkdownEditor, rootCtx } from '@milkdown/kit/core';
import { without } from 'lodash-es';
import { commonmark, keymap as commonmarkKeymap } from '@milkdown/kit/preset/commonmark';
import { gfm, keymap as gfmKeymap } from '@milkdown/kit/preset/gfm';

import { customCtx } from '#web/view/components/MarkdownEditor/customCtx';

import multimedia from '../../../../multimedia';
import topic from '../../../../topic';
import { listNodeView } from '../../../../listItem';
import { linkNodeView } from '../../../nodeView';
import { useContext } from '../context';

export default function MarkdownPreviewer() {
  let rootRef: HTMLDivElement | undefined;
  let editor: MilkdownEditor | undefined;
  const { entity, milkdownCtx } = useContext()!;

  createEffect(() => {
    if (entity.entitySource?.value.data) {
      editor = MilkdownEditor.make()
        .use(without(commonmark, ...commonmarkKeymap)) // 不要引入快捷键。我们自己定制
        .use(without(gfm, ...gfmKeymap)) // 同上
        .use(linkNodeView)
        .use(listNodeView)
        .use(multimedia)
        .use(topic)
        .config((ctx) => {
          ctx.inject(customCtx, { onJump: milkdownCtx.get(customCtx).onJump });
          ctx.set(rootCtx, rootRef);
          ctx.set(defaultValueCtx, entity.entitySource!.value.data!.body);
          ctx.set(editorViewOptionsCtx, { editable: () => false });
        });

      editor.create();
    }
  });

  onCleanup(() => {
    editor?.destroy();
  });

  return (
    <div
      class="w-64 max-h-64 overflow-auto bg-bg-tertiary rounded border border-border-secondary p-2"
      spellcheck={false}
      ref={rootRef}
    ></div>
  );
}
