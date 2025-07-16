import { createMemo, Show } from 'solid-js';
import assert from 'assert';
import { LoaderIcon, PlusIcon } from 'lucide-solid';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import { NoteTypes } from '#domain/shared/model/note';

export default function NoteAddButton(props: { iconOnly?: boolean; buttonClassName?: string; node?: TreeNode }) {
  const { treeViews } = container.resolve(NoteService);
  const node = createMemo(() => props.node ?? treeViews[NoteTypes.Note]?.tree.root);

  const newEditorForm = createMemo(() => {
    const nodeId = node()?.id;

    if (nodeId) {
      return treeViews[NoteTypes.Note]?.newNoteFormMap.get(nodeId);
    }
  });

  function handleClick(e: MouseEvent) {
    const _node = node();
    assert(_node && treeViews[NoteTypes.Note]);

    treeViews[NoteTypes.Note].initNewNoteForm({
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
