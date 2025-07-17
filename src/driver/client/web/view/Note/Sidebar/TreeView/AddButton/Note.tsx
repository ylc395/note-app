import { createMemo, Show } from 'solid-js';
import assert from 'assert';
import { LoaderIcon, PlusIcon } from 'lucide-solid';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import { NoteTypes } from '#domain/shared/model/note';

export default function NoteAddButton(props: { iconOnly?: boolean; buttonClassName?: string; node?: TreeNode }) {
  const { getOrCreateTreeView } = container.resolve(NoteService);
  const treeView = getOrCreateTreeView(NoteTypes.Note);
  const node = createMemo(() => props.node ?? treeView.tree.root);

  const newEditorForm = createMemo(() => {
    const nodeId = node()?.id;

    if (nodeId) {
      return treeView.newNoteFormMap.get(nodeId);
    }
  });

  function handleClick(e: MouseEvent) {
    const _node = node();
    assert(_node);

    treeView.initNewNoteForm({
      parentId: _node.value?.id,
      isAutoSubmit: true,
    });

    e.stopPropagation();
  }

  return (
    <button class={props.buttonClassName} onClick={handleClick}>
      <Show when={newEditorForm()?.isSubmitting} fallback={<PlusIcon />}>
        <LoaderIcon class="animate-spin" />
      </Show>
      <Show when={!props.iconOnly}>新建</Show>
    </button>
  );
}
