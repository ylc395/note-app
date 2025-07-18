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
import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';
import { IS_DEV } from '#domain/shared/infra/env';

import TitleEditor from './TitleEditor';

export default function Node(props: {
  treeView: TreeViewModel;
  note: NoteVO;
  parent: TreeNode;
  indexPath: number[];
  operation: (node: TreeNode) => JSX.Element;
  icon?: (node: TreeNode | NewNoteForm) => JSX.Element;
  onItemTitleClick: (node: TreeNode) => void;
}) {
  const { move } = container.resolve(NoteService);
  const node = props.treeView.tree.getOrCreateNode({ value: props.note, parent: props.parent });
  const newNoteForm = createMemo(() => props.treeView.newNoteFormMap.get(node.id));

  const [dropElementRef, setDropElementRef] = createSignal<HTMLElement>();
  const itemTextClassName = 'whitespace-nowrap overflow-hidden text-ellipsis py-0.5'; // 别弄成 flex，否则文字截断无法生效（只对 inline / block 有效）

  createEffect(
    on(
      () => props.note,
      (note) => node.setValue(note),
    ),
  );

  createEffect(() => {
    const element = dropElementRef();

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
            if (
              node.isUnselectable ||
              location.current.dropTargets[0]?.element !== self.element // 子节点处理过了，这里就不处理了
            ) {
              return;
            }

            const note = NoteService.getNote(source.data);

            if (note) {
              move(note, props.note.id).then(() => node.toggleExpand(true));
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
            asChild={(childProps) => (
              <li
                {...childProps()}
                ref={setDropElementRef}
                class="w-full"
                classList={{ 'menu-disabled': node.isUnselectable }}
              >
                <div
                  class="px-0 flex justify-between w-full group pl-5"
                  classList={{ 'menu-active': node.isHighlighted }}
                >
                  <TreeView.ItemText
                    class={itemTextClassName}
                    style={{ 'padding-left': 'calc((var(--depth) - 1) * 18px)' }}
                  >
                    {props.icon?.(node)}
                    {IS_DEV && `${node.value!.id.slice(0, 4)}+`}
                    {normalizeTitle(node.value!)}
                  </TreeView.ItemText>
                  {props.operation(node)}
                </div>
              </li>
            )}
          />
        }
      >
        <TreeView.Branch
          asChild={(childProps) => (
            <li {...childProps()} class="w-full" classList={{ 'menu-disabled': node.isUnselectable }}>
              <TreeView.BranchControl
                onClick={() => handleItemClick(node)}
                classList={{ 'menu-active': node.isHighlighted }}
                class="gap-0 group px-0"
                ref={setDropElementRef} // dropElement 不能是上一层的 <li> 元素
              >
                <button
                  class="cursor-pointer"
                  style={{ 'padding-left': 'calc((var(--depth) - 1) * 18px)' }}
                  disabled={Boolean(newNoteForm())}
                  onClick={handleArrowClick}
                >
                  <Show when={node.isExpanded || newNoteForm()} fallback={<ChevronRightIcon class="w-5 h-5" />}>
                    <ChevronDownIcon class="w-5 h-5" />
                  </Show>
                </button>
                <TreeView.BranchText class={itemTextClassName}>
                  {props.icon?.(node)}
                  {IS_DEV && `${node.value!.id.slice(0, 4)}+`}
                  {normalizeTitle(node.value!)}
                </TreeView.BranchText>
                {props.operation(node)}
              </TreeView.BranchControl>
              <TreeView.BranchContent
                asChild={(childProps) => (
                  <ul {...childProps()} class="ml-0 pl-0 w-full before:content-none">
                    <Show when={newNoteForm()}>
                      {(form) => (
                        <li
                          class="w-full pl-5 pr-0 flex flex-row items-center"
                          style={{ 'margin-left': 'calc(var(--depth) * 18px)' }}
                        >
                          {props.icon?.(form())}
                          <TitleEditor className="p-0" editor={form()} />
                        </li>
                      )}
                    </Show>
                    <Key each={node.childrenQuery.result.data} by="id">
                      {(child, index) => (
                        <Node {...props} parent={node} note={child()} indexPath={[...props.indexPath, index()]} />
                      )}
                    </Key>
                  </ul>
                )}
              />
            </li>
          )}
        />
      </Show>
    </TreeView.NodeProvider>
  );
}
