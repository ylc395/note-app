import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { Show } from 'solid-js';
import { showFloating, useSelectionChanged, useTooltip } from '../shared/useTooltip';
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

import { wrapInTodoListItem } from '../nodes/listItem';
import { isInEmptyParagraph } from '../shared/prosemirrorUtils';
import TopicTooltip from '../nodes/topic/Tooltip';
import LinkTooltip, { Mode } from '../nodes/link/tooltip/ExternalLinkView';
import TableCreator from '../nodes/table/TableCreator';

export default function View(props: { ctx: Ctx; onClose: () => void }) {
  const editorView = props.ctx.get(editorViewCtx);
  const isBlock = isInEmptyParagraph(editorView.state.selection.$anchor);

  useSelectionChanged({
    ctx: props.ctx,
    fn: props.onClose,
  });

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: 'cursor',
    placement: 'bottom-start',
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
      case 'table':
        showFloating(props.ctx, TableCreator, ({ destroy }) => ({ ctx: props.ctx, onClose: destroy }));
        break;
      case 'topic':
        showFloating(props.ctx, TopicTooltip, ({ destroy }) => ({ ctx: props.ctx, onClose: destroy }));
        break;
      case 'link':
        showFloating(props.ctx, LinkTooltip, ({ destroy }) => ({
          onClose: destroy,
          ctx: props.ctx,
          initialMode: Mode.Add,
        }));
        break;
      default:
        break;
    }
    props.onClose();
  }

  return (
    <Menu.Root onSelect={onSelect} open loopFocus onEscapeKeyDown={props.onClose}>
      <Menu.Content ref={setTooltipEl}>
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
        <Menu.Item value="topic">话题</Menu.Item>
        <Menu.Item value="link">超链接</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
