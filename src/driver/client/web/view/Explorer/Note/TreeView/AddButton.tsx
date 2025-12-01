import { createMemo, Show } from 'solid-js';
import { PlusIcon } from 'lucide-solid';
import type { Placement } from '@floating-ui/dom';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';

export default function ButtonGroup(props: {
  iconOnly?: boolean;
  buttonClassName: string;
  node?: TreeNode;
  menuPlacement: Placement;
}) {
  const { explorer: treeView, createNote } = container.resolve(NoteService);
  const node = createMemo(() => props.node ?? treeView.tree?.root);

  async function onClick(e: MouseEvent) {
    e.preventDefault();
    await createNote({ parentId: node()?.value?.id });
    node()?.toggleExpand(true);
  }

  return (
    <button class={props.buttonClassName} onClick={onClick}>
      <PlusIcon />
      <Show when={!props.iconOnly}>新建</Show>
    </button>
  );
}
