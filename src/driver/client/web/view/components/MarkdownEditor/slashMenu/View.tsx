import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { createMemo, createSignal } from 'solid-js';
import {
  wrapInHeadingCommand,
  createCodeBlockCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  insertHrCommand,
} from '@milkdown/kit/preset/commonmark';
import { callCommand } from '@milkdown/kit/utils';
import { makeEventListener } from '@solid-primitives/event-listener';
import { mergeRefs } from '@solid-primitives/refs';

import Menu, { type MenuItem } from '#web/view/components/Menu';

import { wrapInTodoListItem } from '../nodes/listItem';
import { isInEmptyParagraph, useMilkdownEvent } from '../shared/prosemirrorUtils';
import TopicTooltip from '../nodes/topic/Tooltip';
import { showFloating, useTooltip } from '../shared/useTooltip';
import LinkTooltip, { Mode } from '../nodes/link/tooltip/LinkTooltip';
import TableCreator from '../nodes/table/TableCreator';
import {
  CodeIcon,
  HeadingIcon,
  QuoteIcon,
  ListIcon,
  ListOrderedIcon,
  TableIcon,
  CheckCheckIcon,
  HashIcon,
  LinkIcon,
  SeparatorHorizontalIcon,
} from 'lucide-solid';
import { SLASH_KEY } from './constants';

export default function View(props: { ctx: Ctx; onClose: (slash?: boolean) => void }) {
  const editorView = props.ctx.get(editorViewCtx);
  const isBlock = isInEmptyParagraph(editorView.state.selection.$anchor);
  const [menuRef, setMenuRef] = createSignal<HTMLElement>();

  useMilkdownEvent({
    event: 'selectionUpdated',
    ctx: props.ctx,
    fn: () => props.onClose(),
  });

  makeEventListener(document.body, 'keydown', (e) => {
    if (e.key === SLASH_KEY && document.activeElement === menuRef()) {
      props.onClose(true);
    }
  });

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: 'cursor',
    placement: 'bottom-start',
  });

  function onSelect(value: string) {
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
  }

  const menu = createMemo<Array<MenuItem | 'separator'>>(() => [
    ...(isBlock
      ? [
          { icon: HeadingIcon, label: '标题', key: 'heading' },
          { icon: CodeIcon, label: '代码块', key: 'code' },
          { icon: QuoteIcon, label: '引用块', key: 'quote' },
          { icon: ListIcon, label: '有序列表', key: 'orderList' },
          { icon: ListOrderedIcon, label: '无序列表', key: 'unorderedList' },
          { icon: TableIcon, label: '表格', key: 'table' },
          { icon: SeparatorHorizontalIcon, label: '分隔线', key: 'hr' },
          { icon: CheckCheckIcon, label: 'Todo', key: 'bullet-todo' },
          'separator' as const,
        ]
      : []),
    { icon: HashIcon, label: '话题', key: 'topic' },
    { icon: LinkIcon, label: '超链接', key: 'link' },
  ]);

  return (
    <Menu
      onOpenChange={() => props.onClose()}
      open
      dataForItems={undefined}
      ref={mergeRefs(setMenuRef, setTooltipEl)}
      onSelect={onSelect}
      menu={menu()}
    />
  );
}
