import { autoUpdate, computePosition, flip, hide, type VirtualElement } from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { posToDOMRect } from '@milkdown/kit/prose';
import { createEffect, onCleanup } from 'solid-js';
import { Menu } from '@ark-ui/solid';
import {
  wrapInHeadingCommand,
  createCodeBlockCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  insertHrCommand,
} from '@milkdown/kit/preset/commonmark';
import { callCommand } from '@milkdown/kit/utils';

import { wrapInTodoListItem } from '../nodes/todoListItem';

export default function View(props: { ctx: Ctx; onClose: () => void }) {
  let menuRoot: HTMLDivElement | undefined;

  createEffect(() => {
    if (!menuRoot) {
      return;
    }

    const editorView = props.ctx.get(editorViewCtx);
    const pos = editorView.state.selection.anchor;
    const virtualElement: VirtualElement = {
      contextElement: editorView.dom,
      getBoundingClientRect: () => posToDOMRect(editorView, pos, pos),
    };

    const stopAutoUpdate = autoUpdate(virtualElement, menuRoot, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(virtualElement, menuRoot, {
        middleware: [hide({ boundary, strategy: 'escaped' }), flip({ boundary })],
        placement: 'bottom-start',
      });

      Object.assign(menuRoot.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });
    onCleanup(stopAutoUpdate);
  });

  function onSelect({ value }: { value: string }) {
    const editor = props.ctx.get(editorCtx);

    switch (value) {
      case 'heading':
        editor.action(callCommand(wrapInHeadingCommand.key));
        break;
      case 'code':
        editor.action(callCommand(createCodeBlockCommand.key));
        break;
      case 'quote':
        editor.action(callCommand(wrapInBlockquoteCommand.key));
        break;
      case 'orderList':
        editor.action(callCommand(wrapInOrderedListCommand.key));
        break;
      case 'unorderedList':
        editor.action(callCommand(wrapInBulletListCommand.key));
        break;
      case 'hr':
        editor.action(callCommand(insertHrCommand.key));
        break;
      case 'ordered-todo':
        editor.action(callCommand(wrapInTodoListItem.key, { listType: 'ordered' }));
        break;
      case 'bullet-todo':
        editor.action(callCommand(wrapInTodoListItem.key, { listType: 'bullet' }));
        break;
      default:
        break;
    }
    props.onClose();
  }

  return (
    <Menu.Root onSelect={onSelect} open loopFocus onEscapeKeyDown={props.onClose}>
      <Menu.Content ref={menuRoot} class="absolute">
        <Menu.Item value="heading">标题</Menu.Item>
        <Menu.Item value="code">代码块</Menu.Item>
        <Menu.Item value="quote">引用块</Menu.Item>
        <Menu.Item value="orderList">有序列表</Menu.Item>
        <Menu.Item value="unorderedList">无序列表</Menu.Item>
        <Menu.Item value="hr">分隔线</Menu.Item>
        <Menu.Item value="ordered-todo">有序 Todo</Menu.Item>
        <Menu.Item value="bullet-todo">无序 Todo</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
