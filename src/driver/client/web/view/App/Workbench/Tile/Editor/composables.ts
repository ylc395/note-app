import { createContextProvider } from '@solid-primitives/context';
import { createEffect, createMemo, on } from 'solid-js';
import assert from 'assert';

import type BaseEditor from '#domain/client/app/model/Workbench/BaseEditor';
import NoteBaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';
import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';

export const [ContextProvider, useContext] = createContextProvider((props: { editor: BaseEditor }) => ({
  editor: props.editor,
}));

/**
 * 负责多编辑器之间的 body 同步：
 * - 当其他编辑器修改了 body 时，通过 replaceContent 同步到本编辑器
 * - 当本编辑器修改了 body 时，调用 editor.update 上报
 */
export function useEditorBody(getMdEditor: () => Editor | undefined) {
  const workbench = container.resolve(Workbench);
  const editor = createMemo(() => {
    const result = useContext()!.editor;
    assert(result instanceof NoteBaseEditor);
    return result;
  });

  // 其他编辑器改动内容时，本编辑器同步更新
  createEffect(
    on(
      () => editor().source.value.data?.body,
      (body) => {
        const mdEditor = getMdEditor();
        if (mdEditor?.isCreated && typeof body === 'string' && workbench.currentEditor && !editor().isGlobalCurrent) {
          mdEditor.replaceContent(body);
        }
      },
    ),
  );

  function onUpdate(text: string) {
    if (editor().isGlobalCurrent) {
      editor().update({ body: text });
    }
  }

  return { onUpdate };
}
