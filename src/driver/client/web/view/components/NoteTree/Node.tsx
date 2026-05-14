import { createMemo, JSX, Show } from 'solid-js';
import { ChevronDownIcon, ChevronRightIcon, LoaderIcon, StarIcon } from 'lucide-solid';
import { Key } from '@solid-primitives/keyed';
import { cx } from 'class-variance-authority';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import TreeExplorer, { TreeNodeStates } from '#domain/client/app/model/note/TreeExplorer';
import container from '#utils/singletonContainer';
import { IS_DEV } from '#domain/shared/infra/env';
import Workbench from '#domain/client/app/model/Workbench';

import useDnd from './useDnd';
import Menu, { type MenuItem } from '../Menu';
import Icon from '../Icon';

export interface Props {
  treeExplorer: TreeExplorer;
  node: TreeNode;
  parent: TreeNode;
  indexPath: number[];
  renderOperation?: (node: TreeNode) => JSX.Element;
  contextMenu?: (node: TreeNode) => Array<MenuItem | 'separator'>;
  onItemTitleClick: (node: TreeNode) => void;
  onContextMenuClick?: (key: string) => void;
  shouldRenderIcon?: (node: TreeNode) => boolean;
  groupKey?: symbol;
}

export default function Node(props: Props) {
  const workbench = container.resolve(Workbench);
  const { isDropHovering, setDndElementRef } = useDnd(props);

  const itemClassName =
    'mb-1 rounded cursor-pointer flex group items-center hover:bg-bg-tertiary hover:text-fg-secondary px-1';
  const itemTextClassName = 'whitespace-nowrap overflow-hidden text-ellipsis py-2 grow'; // 别弄成 flex，否则文字截断无法生效（只对 inline / block 有效）
  const paddingLeft = createMemo(() => (props.indexPath.length - 1) * 28);
  const itemClassList = createMemo(() => ({
    'bg-bg-accent-subtle text-fg-accent-subtle':
      workbench.currentEditor?.entityId === props.node.id && !props.node.is(TreeNodeStates.Selected),
    'opacity-30': props.node.is(TreeNodeStates.Unselectable),
    'bg-bg-hover':
      (isDropHovering() && !props.node.is(TreeNodeStates.Unselectable)) || props.node.is(TreeNodeStates.Selected),
  }));
  const iconClassName = createMemo(
    () => `mr-1 p-0 shrink-0 w-4 h-4 inline ${props.node.icon ? '' : 'align-text-bottom'}`,
  );

  function handleItemClick(node: TreeNode, e: MouseEvent) {
    if (e.metaKey) {
      node.toggleState(TreeNodeStates.Selected);
    } else {
      props.treeExplorer.select([]);
      props.onItemTitleClick?.(node);
    }
  }

  function handleArrowClick(e: MouseEvent) {
    e.stopPropagation();
    props.node.toggleExpand();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function wrapContextmenu(render: (props: JSX.HTMLAttributes<any>) => JSX.Element) {
    function handleOpenChange({ open }: { open: boolean }) {
      if (!open || props.node.is(TreeNodeStates.Selected)) {
        return;
      }

      props.treeExplorer.select([props.node.id]);
    }

    return (
      <Menu
        contextmenu
        menuGroupKey={props.groupKey}
        onOpenChange={handleOpenChange}
        onSelect={props.onContextMenuClick}
        menu={props.contextMenu?.(props.node)}
        topContent={
          <Show when={props.treeExplorer.treeNodeSets.selected.size > 1}>
            <div class="font-bold p-1">共选中 {props.treeExplorer.treeNodeSets.selected.size} 项</div>
          </Show>
        }
      >
        {(childProps) => render(childProps)}
      </Menu>
    );
  }

  function renderInline() {
    return (
      <>
        <Show when={props.node.isFake}>
          <LoaderIcon class={iconClassName()} />
        </Show>
        <Show when={props.shouldRenderIcon?.(props.node)}>
          <Icon {...props.node.value} className={iconClassName()} />
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
          ref={setDndElementRef}
          class={itemClassName}
          classList={itemClassList()}
        >
          {wrapContextmenu((renderProps) => (
            <div
              {...renderProps}
              data-item-id={props.node.id}
              class={cx(itemTextClassName, 'ml-5')}
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
          ref={setDndElementRef} // dropElement 不能是上一层的 <li> 元素
        >
          {/** 展开/收起图标 */}
          <button class="cursor-pointer" style={{ 'padding-left': `${paddingLeft()}px` }} onClick={handleArrowClick}>
            <Show when={props.node.isExpanded} fallback={<ChevronRightIcon class="w-5 h-5" />}>
              <ChevronDownIcon class="w-5 h-5" />
            </Show>
          </button>
          {wrapContextmenu((renderProps) => (
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
