import { createMemo, JSX, Show } from 'solid-js';
import { ChevronDownIcon, ChevronRightIcon, StarIcon } from 'lucide-solid';
import { Key } from '@solid-primitives/keyed';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import TreeViewModel, { TreeNodeStates } from '#domain/client/app/model/note/TreeExplorer';
import container from '#utils/singletonContainer';
import { IS_DEV } from '#domain/shared/infra/env';
import Workbench from '#domain/client/app/model/Workbench';

import useDnd from './useDnd';
import ContextMenu, { type MenuItem } from '../common/ContextMenu';
import Icon from '../common/Icon';

export interface Props {
  treeView: TreeViewModel;
  node: TreeNode;
  parent: TreeNode;
  indexPath: number[];
  renderOperation?: (node: TreeNode) => JSX.Element;
  contextMenu?: (node: TreeNode) => Array<MenuItem | 'separator'>;
  onItemTitleClick: (node: TreeNode) => void;
  onContextMenuClick?: (key: string) => void;
  shouldRenderIcon?: (node: TreeNode) => boolean;
}

export default function Node(props: Props) {
  const workbench = container.resolve(Workbench);
  const { isDropHovering, setDropElementRef } = useDnd(props);

  const itemClassName =
    'mb-stack-xs rounded cursor-pointer flex group items-center hover:bg-surface-tertiary hover:text-text-secondary px-inset-square-s';
  const itemTextClassName = 'whitespace-nowrap overflow-hidden text-ellipsis py-inset-square-md grow'; // 别弄成 flex，否则文字截断无法生效（只对 inline / block 有效）
  const paddingLeft = createMemo(() => (props.indexPath.length - 1) * 28);
  const itemClassList = createMemo(() => ({
    'bg-brand-subtle text-brand-secondary':
      workbench.currentEditor?.noteId === props.node.id && !props.node.is(TreeNodeStates.Selected),
    'opacity-30': props.node.is(TreeNodeStates.Unselectable),
    'bg-surface-tertiary':
      (isDropHovering() && !props.node.is(TreeNodeStates.Unselectable)) || props.node.is(TreeNodeStates.Selected),
  }));
  const iconClassName = createMemo(
    () => `mr-stack-xs p-0 shrink-0 w-4 h-4 inline ${props.node.icon ? '' : 'align-text-bottom'}`,
  );

  function handleItemClick(node: TreeNode, e: MouseEvent) {
    if (e.metaKey) {
      node.toggleState(TreeNodeStates.Selected);
    } else {
      props.treeView.select([]);
      props.onItemTitleClick?.(node);
    }
  }

  function handleArrowClick(e: MouseEvent) {
    e.stopPropagation();
    props.node.toggleExpand();
  }

  function renderItem(render: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element) {
    function handleOpenChange({ open }: { open: boolean }) {
      if (!open && props.node.is(TreeNodeStates.Selected) && props.treeView.treeNodeSets.selected.size === 1) {
        props.node.toggleState(TreeNodeStates.Selected, false);
        return;
      }

      if (!open || props.node.is(TreeNodeStates.Selected)) {
        return;
      }

      props.treeView.select([props.node.id]);
    }

    return (
      <ContextMenu
        onOpenChange={handleOpenChange}
        onItemClick={props.onContextMenuClick}
        contextMenu={props.contextMenu}
        seed={props.node}
        topExtraContent={() => (
          <Show when={props.treeView.treeNodeSets.selected.size > 1}>
            <div class="font-bold p-inset-square-s">共选中 {props.treeView.treeNodeSets.selected.size} 项</div>
          </Show>
        )}
      >
        {(childProps) => render(childProps)}
      </ContextMenu>
    );
  }

  function renderInline() {
    return (
      <>
        <Show when={props.shouldRenderIcon?.(props.node)}>
          <Icon {...props.node.value} iconClassName={iconClassName()} />
        </Show>
        {props.node.value?.isStar && <StarIcon stroke-width={0} fill="yellow" class={iconClassName()} />}
        {IS_DEV && `${props.node.value!.id.slice(0, 4)}+`}
        {props.node.title}
      </>
    );
  }

  return (
    <Show
      when={!props.node.isLeaf}
      fallback={
        <li
          onClick={[handleItemClick, props.node]}
          ref={setDropElementRef}
          class={itemClassName}
          classList={itemClassList()}
        >
          {renderItem((renderProps) => (
            <div
              {...renderProps}
              data-item-id={props.node.id}
              class={`${itemTextClassName} ml-5`} // ml 和展开图标的尺寸一致
              style={{ 'padding-left': `${paddingLeft()}px` }}
            >
              {renderInline()}
            </div>
          ))}
          {props.renderOperation?.(props.node)}
        </li>
      }
    >
      <li class="w-full">
        <div
          onClick={[handleItemClick, props.node]}
          class={itemClassName}
          classList={itemClassList()}
          data-item-id={props.node.id}
          ref={setDropElementRef} // dropElement 不能是上一层的 <li> 元素
        >
          {/** 展开/收起图标 */}
          <button class="cursor-pointer" style={{ 'padding-left': `${paddingLeft()}px` }} onClick={handleArrowClick}>
            <Show when={props.node.isExpanded} fallback={<ChevronRightIcon class="w-5 h-5" />}>
              <ChevronDownIcon class="w-5 h-5" />
            </Show>
          </button>
          {renderItem((renderProps) => (
            <div {...renderProps} class={itemTextClassName}>
              {renderInline()}
            </div>
          ))}
          {/** 行操作区 */}
          {props.renderOperation?.(props.node)}
        </div>
        {/** 子树 */}
        <Show when={props.node.isExpanded}>
          <Show when={props.node.sortedChildren && props.node.sortedChildren.length > 0}>
            <ul>
              <Key each={props.node.sortedChildren} by="id">
                {(child, index) => (
                  <Node {...props} parent={props.node} node={child()} indexPath={[...props.indexPath, index()]} />
                )}
              </Key>
            </ul>
          </Show>
        </Show>
      </li>
    </Show>
  );
}
