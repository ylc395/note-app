import { FolderIcon, FolderOpenIcon } from 'lucide-solid';
import { onCleanup } from 'solid-js';

import { NoteTypes } from '#domain/shared/model/note';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';

import BaseTreeView from './BaseTree';
import MaterialAddButton from './AddButton/Material';

export default function MaterialTree() {
  const { workbench, initTreeView } = container.resolve(NoteService);
  const tree = initTreeView(NoteTypes.Material);

  onCleanup(() => tree.destroy());

  function handleItemClick(node: TreeNode) {
    if (!node.value) {
      return;
    }

    if (node.value.mimeType) {
      workbench.open(node.value);
    } else if (!node.isLeaf) {
      node.toggleExpand();
    }
  }

  function getIcon(node: TreeNode | NewNoteForm) {
    const className = 'mr-2 p-0 shrink-0 w-4 h-4 inline align-text-bottom';
    return node instanceof TreeNode && (node.value?.mimeType ? null : node.isExpanded) ? (
      <FolderOpenIcon class={className} />
    ) : (
      <FolderIcon class={className} />
    );
  }

  return (
    <BaseTreeView
      onItemTitleClick={handleItemClick}
      treeView={tree}
      useNewNoteEditor
      icon={getIcon}
      operation={(node) => (
        <MaterialAddButton
          buttonClassName="btn btn-xs btn-square mr-1 data-[state='open']:inline-flex group-hover:inline-flex hidden"
          iconOnly
          node={node}
        />
      )}
    />
  );
}
