import { TreeView } from '@ark-ui/solid';
import { createEffect, createMemo, on, onCleanup, Show, type JSX } from 'solid-js';
import { Key } from '@solid-primitives/keyed';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-solid';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
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
  operation: (note: NoteVO) => JSX.Element;
}) {
  const workbench = container.resolve(Workbench);
  const node = props.treeView.tree.createNode({ value: props.note, parent: props.parent });
  const hasEditor = createMemo(() => node.id === props.treeView.newNoteEditor?.value?.parentId);

  createEffect(
    on(
      () => props.note,
      (note) => node.setValue(note),
    ),
  );

  onCleanup(() => {
    node.destroy();
  });

  function openNote(note: NoteVO) {
    workbench.openEntity({
      entityType: EntityTypes.Note,
      entityId: note.id,
      mimeType: note.mimeType || undefined,
    });
  }

  return (
    <TreeView.NodeProvider node={node} indexPath={props.indexPath}>
      <Show
        when={!node.isLeaf || hasEditor()}
        fallback={
          <TreeView.Item
            onClick={() => openNote(node.value!)}
            class="flex items-center pl-5 cursor-pointer"
            style={{ 'margin-left': `${(props.indexPath.length - 1) * 20}px` }}
          >
            <TreeView.ItemText>{normalizeTitle(node.value!)}</TreeView.ItemText>
            {props.operation(node.value!)}
          </TreeView.Item>
        }
      >
        <TreeView.Branch style={{ 'margin-left': `${(props.indexPath.length - 1) * 20}px` }}>
          <TreeView.BranchControl class="flex items-center relative pl-5">
            <button class="absolute left-0" onClick={() => node.toggleExpand()}>
              <Show when={node.isExpanded} fallback={<ChevronRightIcon />}>
                <ChevronDownIcon />
              </Show>
            </button>
            <TreeView.BranchText onClick={() => openNote(node.value!)}>
              {normalizeTitle(node.value!)}
            </TreeView.BranchText>
            {props.operation(node.value!)}
          </TreeView.BranchControl>
          <TreeView.BranchContent>
            <Show when={hasEditor()}>
              <TitleEditor editor={props.treeView.newNoteEditor} />
            </Show>
            <Key each={node.childrenQuery.result.data} by="id">
              {(child, index) => (
                <Node
                  operation={props.operation}
                  treeView={props.treeView}
                  parent={node}
                  note={child()}
                  indexPath={[...props.indexPath, index()]}
                />
              )}
            </Key>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}

export default Node;
