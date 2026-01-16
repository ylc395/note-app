import { autoUpdate, computePosition, flip, hide, type VirtualElement } from '@floating-ui/dom';
import { editorCtx, editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { posToDOMRect } from '@milkdown/kit/prose';
import { createEffect, onCleanup, Show } from 'solid-js';
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
import { isInEmptyParagraph } from '../shared/prosemirrorUtils';
import { editNewTopicCommand } from '../nodes/topic/commands';
import { editNewLinkCommand } from '../nodes/link/commands';
import { listenerCtx } from '@milkdown/kit/plugin/listener';
import { pull } from 'lodash-es';

export default function View(props: { ctx: Ctx; onClose: () => void }) {
  let menuRoot: HTMLDivElement | undefined;
  const editor = props.ctx.get(editorCtx);
  const editorView = props.ctx.get(editorViewCtx);
  const isBlock = isInEmptyParagraph(editorView.state.selection.$anchor);

  editor.action(() => {
    const listener = props.ctx.get(listenerCtx);
    listener.selectionUpdated(props.onClose);
  });

  onCleanup(() => {
    const listener = props.ctx.get(listenerCtx);
    pull(listener.listeners.selectionUpdated, props.onClose);
  });

  createEffect(() => {
    if (!menuRoot) {
      return;
    }

    const virtualElement: VirtualElement = {
      contextElement: editorView.dom,
      getBoundingClientRect: () =>
        posToDOMRect(editorView, editorView.state.selection.anchor, editorView.state.selection.anchor),
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
      case 'bullet-todo':
        editor.action(callCommand(wrapInTodoListItem.key, { listType: 'bullet' }));
        break;
      case 'topic':
        editor.action(callCommand(editNewTopicCommand.key));
        break;
      case 'link':
        editor.action(callCommand(editNewLinkCommand.key));
        break;
      default:
        break;
    }
    props.onClose();
  }

  return (
    <Menu.Root onSelect={onSelect} open loopFocus onEscapeKeyDown={props.onClose}>
      <Menu.Content ref={menuRoot} class="absolute">
        <Show when={isBlock}>
          <Menu.Item value="heading">标题</Menu.Item>
          <Menu.Item value="code">代码块</Menu.Item>
          <Menu.Item value="quote">引用块</Menu.Item>
          <Menu.Item value="orderList">有序列表</Menu.Item>
          <Menu.Item value="unorderedList">无序列表</Menu.Item>
          <Menu.Item value="table">表格</Menu.Item>
          <Menu.Item value="hr">分隔线</Menu.Item>
          <Menu.Item value="bullet-todo">Todo</Menu.Item>
          <Menu.Separator />
        </Show>
        <Menu.Item value="time">时间</Menu.Item>
        <Menu.Item value="topic">话题</Menu.Item>
        <Menu.Item value="link">超链接</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
