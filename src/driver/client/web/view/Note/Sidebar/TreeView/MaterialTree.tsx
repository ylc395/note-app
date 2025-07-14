import { FolderIcon, FolderOpenIcon } from 'lucide-solid';
import { onCleanup } from 'solid-js';

import { NoteTypes } from '#domain/shared/model/note';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';

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

  function getIcon(node: TreeNode) {
    return node.value?.mimeType ? null : node.isExpanded ? (
      <FolderOpenIcon class="mr-1 shrink-0" />
    ) : (
      <FolderIcon class="mr-1 shrink-0" />
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
          triggerClassName="group-hover:visible data-[state='open']:visible invisible absolute right-0 bg-gray-200"
          iconOnly
          node={node}
        />
      )}
    />
  );
}
