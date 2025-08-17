import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  Show,
  untrack,
  type JSX,
  type JSXElement,
} from 'solid-js';
import { Key } from '@solid-primitives/keyed';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, FileTextIcon } from 'lucide-solid';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import TreeViewModel from '#domain/client/app/model/note/TreeView';
import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';
import NoteService from '#domain/client/app/service/NoteService';
import { IS_DEV } from '#domain/shared/infra/env';

function call(fn: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element) {
  return fn({});
}

export default function Node(props: {
  treeView: TreeViewModel;
  note: NoteVO;
  parent: TreeNode;
  indexPath: number[];
  renderOperation?: (node: TreeNode) => JSX.Element;
  renderItem?: (original: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSXElement) => JSXElement;
  onItemTitleClick: (node: TreeNode) => void;
}) {
  const { move } = container.resolve(NoteService);
  const node = props.treeView.tree.getOrCreateNode({ value: props.note, parent: props.parent });

  const [dropElementRef, setDropElementRef] = createSignal<HTMLElement>();
  const [isDropHovering, setIsDropHovering] = createSignal(false);
  const itemClassName =
    'mb-stack-xs rounded cursor-pointer flex group items-center hover:bg-surface-tertiary hover:text-text-secondary px-inset-square-s';
  const itemTextClassName = 'whitespace-nowrap overflow-hidden text-ellipsis py-inset-square-md grow'; // 别弄成 flex，否则文字截断无法生效（只对 inline / block 有效）
  const paddingLeft = createMemo(() => (props.indexPath.length - 1) * 28);
  const itemClassList = createMemo(() => ({
    'bg-brand-subtle text-brand-secondary': node.isHighlighted,
    'opacity-30': node.isUnselectable,
    'bg-surface-tertiary': isDropHovering() && !node.isUnselectable,
  }));

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
          onDragEnter: () => {
            setIsDropHovering(true);
          },
          onDragLeave: () => {
            setIsDropHovering(false);
          },
          onDrop: ({ source, self, location }) => {
            setIsDropHovering(false);

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
    node.toggleExpand();
  }

  function renderIcon(node: TreeNode) {
    const className = 'mr-stack-xs p-0 shrink-0 w-4 h-4 inline align-text-bottom';

    if (!(node instanceof TreeNode)) {
      return <FolderIcon class={className} />;
    }

    if (node.value?.icon) {
      return null; // todo: 改成图标
    }

    if (!node.value?.mimeType) {
      return <FileTextIcon class={className} />;
    }

    switch (node.value.mimeType) {
      case MimeTypes.PDF:
        return <FileTextIcon class={className} />;
      default:
        break;
    }
  }

  return (
    <Show
      when={!node.isLeaf}
      fallback={
        <li onClick={[handleItemClick, node]} ref={setDropElementRef} class={itemClassName} classList={itemClassList()}>
          {(props.renderItem || call)((renderProps) => (
            <div
              {...renderProps}
              class={`${itemTextClassName} ml-5`} // ml 和展开图标的尺寸一致
              style={{ 'padding-left': `${paddingLeft()}px` }}
            >
              {renderIcon(node)}
              {IS_DEV && `${node.value!.id.slice(0, 4)}+`}
              {normalizeTitle(node.value!)}
            </div>
          ))}
          {props.renderOperation?.(node)}
        </li>
      }
    >
      <li class="w-full">
        <div
          onClick={[handleItemClick, node]}
          class={itemClassName}
          classList={itemClassList()}
          ref={setDropElementRef} // dropElement 不能是上一层的 <li> 元素
        >
          {/** 展开/收起图标 */}
          <button class="cursor-pointer" style={{ 'padding-left': `${paddingLeft()}px` }} onClick={handleArrowClick}>
            <Show when={node.isExpanded} fallback={<ChevronRightIcon class="w-5 h-5" />}>
              <ChevronDownIcon class="w-5 h-5" />
            </Show>
          </button>
          {(props.renderItem || call)((renderProps) => (
            <div {...renderProps} class={itemTextClassName}>
              {renderIcon(node)}
              {IS_DEV && `${node.value!.id.slice(0, 4)}+`}
              {normalizeTitle(node.value!)}
            </div>
          ))}
          {/** 行操作区 */}
          {props.renderOperation?.(node)}
        </div>
        {/** 子树 */}
        <Show when={node.isExpanded}>
          <ul>
            <Key each={node.childrenQuery.result.data} by="id">
              {(child, index) => (
                <Node {...props} parent={node} note={child()} indexPath={[...props.indexPath, index()]} />
              )}
            </Key>
          </ul>
        </Show>
      </li>
    </Show>
  );
}
