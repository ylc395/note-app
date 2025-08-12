import { FolderIcon, FolderOpenIcon, FileTextIcon } from 'lucide-solid';

import { NoteTypes } from '#domain/shared/model/note';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';
import { MimeTypes } from '#domain/shared/model/file';

import BaseTreeView, { addButtonClassName } from './BaseTree';
import MaterialAddButton from './AddButton/Material';
export default function MaterialTree() {
  const { workbench, getOrCreateTreeView } = container.resolve(NoteService);
  const tree = getOrCreateTreeView(NoteTypes.Material);

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

  function renderIcon(node: TreeNode | NewNoteForm) {
    const className = 'mr-2 p-0 shrink-0 w-4 h-4 inline align-text-bottom';

    if (!(node instanceof TreeNode)) {
      return <FolderIcon class={className} />;
    }

    if (node.value?.icon) {
      return null; // todo: 改成图标
    }

    if (!node.value?.mimeType) {
      return node.isExpanded ? <FolderOpenIcon class={className} /> : <FolderIcon class={className} />;
    }

    switch (node.value.mimeType) {
      case MimeTypes.PDF:
        return <FileTextIcon class={className} />;
      default:
        break;
    }
  }

  return (
    <BaseTreeView
      onItemTitleClick={handleItemClick}
      treeView={tree}
      useNewNoteEditor
      renderIcon={renderIcon}
      renderOperation={(node) => <MaterialAddButton buttonClassName={addButtonClassName} iconOnly node={node} />}
    />
  );
}
