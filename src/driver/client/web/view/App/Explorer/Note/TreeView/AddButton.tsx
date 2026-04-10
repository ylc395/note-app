import { createMemo, Show } from 'solid-js';
import { PlusIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import Button from '#web/view/components/Button';
import clsx from 'clsx';

export default function AddButton(props: { iconOnly?: boolean; node?: TreeNode; class?: string }) {
  const { explorer: treeView, createNote } = container.resolve(NoteService);
  const node = createMemo(() => props.node ?? treeView.tree?.root);

  async function onClick(e: MouseEvent) {
    e.preventDefault();
    await createNote({ parentId: node()?.value?.id });
    node()?.toggleExpand(true);
  }

  return (
    <Button
      square={props.iconOnly}
      size={props.iconOnly ? 'small' : 'md'}
      variant="primary"
      onClick={onClick}
      class={clsx('grow-0 shrink-0', props.class)}
    >
      <PlusIcon />
      <Show when={!props.iconOnly}>新建</Show>
    </Button>
  );
}
