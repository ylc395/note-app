import { TreeView } from '@ark-ui/solid';
import { createEffect, createMemo, on, onCleanup, Show, type JSX } from 'solid-js';
import { Key } from '@solid-primitives/keyed';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-solid';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, NoteTypes, type NoteVO } from '#domain/shared/model/note';
import TreeViewModel from '#domain/client/app/model/note/TreeView';
import { container } from '#domain/shared/infra/singletons';
import Workbench from '#domain/client/app/model/Workbench';

import TitleEditor from './TitleEditor';
import { EntityTypes } from '#domain/shared/model/entity';

function Node(props: {
  treeView: TreeViewModel;
  note: NoteVO;
  parent: TreeNode;
  indexPath: number[];
  operation: (node: TreeNode) => JSX.Element;
  icon?: (node: TreeNode) => JSX.Element;
}) {
  const workbench = container.resolve(Workbench);
  const node = props.treeView.tree.createNode({ value: props.note, parent: props.parent });
  const hasEditor = createMemo(
    () => node.id === props.treeView.newNoteEditor?.value?.parentId && !props.treeView.newNoteEditor.isAutoSubmit,
  );
  const itemClassName = 'flex items-center pl-5 cursor-pointer group relative hover:bg-gray-100 py-1';
  const itemTextClassName = 'whitespace-nowrap overflow-hidden text-ellipsis';

  createEffect(
    on(
      () => props.note,
      (note) => node.setValue(note),
    ),
  );

  onCleanup(() => {
    node.destroy();
  });

  function handleItemClick(node: TreeNode) {
    const note = node.value;

    if (!note) {
      return;
    }

    if (note.type === NoteTypes.Material && !note.mimeType) {
      if (!node.isLeaf) {
        node.toggleExpand();
      }
    } else {
      workbench.openEntity({
        entityType: EntityTypes.Note,
        entityId: note.id,
        mimeType: note.mimeType || undefined,
      });
    }
  }

  function handleArrowClick(e: MouseEvent) {
    e.stopPropagation();

    if (!hasEditor()) {
      node.toggleExpand();
    }
  }

  return (
    <TreeView.NodeProvider node={node} indexPath={props.indexPath}>
      <Show
        when={!node.isLeaf || hasEditor()}
        fallback={
          <TreeView.Item
            onClick={() => handleItemClick(node)}
            class={itemClassName}
            classList={{ 'ml-4': props.indexPath.length > 1 }}
          >
            {props.icon?.(node)}
            <TreeView.ItemText class={itemTextClassName}>{normalizeTitle(node.value!)}</TreeView.ItemText>
            {props.operation(node)}
          </TreeView.Item>
        }
      >
        <TreeView.Branch classList={{ 'ml-4': props.indexPath.length > 1 }}>
          <TreeView.BranchControl class={`pl-5 ${itemClassName}`} onClick={() => handleItemClick(node)}>
            <button class="absolute left-0" disabled={hasEditor()} onClick={handleArrowClick}>
              <Show when={node.isExpanded || hasEditor()} fallback={<ChevronRightIcon />}>
                <ChevronDownIcon />
              </Show>
            </button>
            {props.icon?.(node)}
            <TreeView.BranchText class={itemTextClassName}>{normalizeTitle(node.value!)}</TreeView.BranchText>
            {props.operation(node)}
          </TreeView.BranchControl>
          <TreeView.BranchContent>
            <Show when={hasEditor()}>
              <TitleEditor editor={props.treeView.newNoteEditor} />
            </Show>
            <Key each={node.childrenQuery.result.data} by="id">
              {(child, index) => (
                <Node {...props} parent={node} note={child()} indexPath={[...props.indexPath, index()]} />
              )}
            </Key>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}

export default Node;
