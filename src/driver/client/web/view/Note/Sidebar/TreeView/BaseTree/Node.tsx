import { TreeView } from '@ark-ui/solid';
import { createEffect, createMemo, createSignal, on, onCleanup, Show, untrack, type JSX } from 'solid-js';
import { Key } from '@solid-primitives/keyed';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-solid';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import TreeViewModel from '#domain/client/app/model/note/TreeView';
import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';

import TitleEditor from './TitleEditor';

function Node(props: {
  treeView: TreeViewModel;
  note: NoteVO;
  parent: TreeNode;
  indexPath: number[];
  operation: (node: TreeNode) => JSX.Element;
  icon?: (node: TreeNode) => JSX.Element;
  onItemTitleClick: (node: TreeNode) => void;
}) {
  const { move } = container.resolve(NoteService);
  const node = props.treeView.tree.createNode({ value: props.note, parent: props.parent });
  const newNoteForm = createMemo(() => props.treeView.newNoteFormMap.get(node.id));

  const [rootRef, setRootRef] = createSignal<HTMLElement>();
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

  createEffect(() => {
    const element = rootRef();

    if (!element) {
      return;
    }

    const cleanup = untrack(() =>
      combine(
        draggable({
          element,
          canDrag: () => !node.isRoot,
          getInitialData: () => node as unknown as Record<string, unknown>,
        }),
        dropTargetForElements({
          element,
          onDrop: ({ source, self, location }) => {
            // 子节点处理过了，这里就不处理了
            if (location.current.dropTargets[0]?.element !== self.element) {
              return;
            }

            const note = NoteService.getNote(source.data);

            if (note) {
              move(note.id, props.note.id).then(() => node.toggleExpand(true));
            }
          },
        }),
      ),
    );

    onCleanup(cleanup);
  });

  function handleItemClick(node: TreeNode) {
    props.onItemTitleClick?.(node);
  }

  function handleArrowClick(e: MouseEvent) {
    e.stopPropagation();

    if (!newNoteForm()) {
      node.toggleExpand();
    }
  }

  return (
    <TreeView.NodeProvider node={node} indexPath={props.indexPath}>
      <Show
        when={!node.isLeaf || newNoteForm()}
        fallback={
          <TreeView.Item
            onClick={() => handleItemClick(node)}
            class={itemClassName}
            ref={setRootRef}
            classList={{ 'ml-4': props.indexPath.length > 1 }}
          >
            {props.icon?.(node)}
            <TreeView.ItemText class={itemTextClassName}>{normalizeTitle(node.value!)}</TreeView.ItemText>
            {props.operation(node)}
          </TreeView.Item>
        }
      >
        <TreeView.Branch classList={{ 'ml-4': props.indexPath.length > 1 }} ref={setRootRef}>
          <TreeView.BranchControl class={`pl-5 ${itemClassName}`} onClick={() => handleItemClick(node)}>
            <button class="absolute left-0" disabled={Boolean(newNoteForm())} onClick={handleArrowClick}>
              <Show when={node.isExpanded || newNoteForm()} fallback={<ChevronRightIcon />}>
                <ChevronDownIcon />
              </Show>
            </button>
            {props.icon?.(node)}
            <TreeView.BranchText class={itemTextClassName}>{normalizeTitle(node.value!)}</TreeView.BranchText>
            {props.operation(node)}
          </TreeView.BranchControl>
          <TreeView.BranchContent>
            <Show when={newNoteForm()}>{(form) => <TitleEditor editor={form()} />}</Show>
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
