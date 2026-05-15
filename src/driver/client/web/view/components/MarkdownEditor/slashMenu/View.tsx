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
import { flow } from 'lodash-es';
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

import Menu, { type MenuItem } from '#web/view/components/Menu';
import { renderSolidApp } from '#web/utils/dom';

import { wrapInTodoListItem } from '../nodes/listItem';
import { isInEmptyParagraph } from '../shared/prosemirrorUtils';
import TopicTooltip from '../nodes/topic/Tooltip';
import { useTooltip } from '../shared/useTooltip';
import LinkTooltip, { Mode } from '../nodes/link/tooltip/LinkTooltip';
import TableCreator from '../nodes/table/TableCreator';
import { SLASH_KEY } from './constants';

export default function View(props: { ctx: Ctx; onClose: (slash?: boolean) => void }) {
  const editorView = props.ctx.get(editorViewCtx);
  const isBlock = isInEmptyParagraph(editorView.state.selection.$anchor);
  const [menuRef, setMenuRef] = createSignal<HTMLElement>();

  makeEventListener(document.body, 'keydown', (e) => {
    if (e.key === SLASH_KEY && document.activeElement === menuRef()) {
      props.onClose(true);
    }
  });

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: 'cursor',
    placement: 'bottom-start',
    onCursorChange: props.onClose,
  });

  function onSelect(value: string) {
    const editor = props.ctx.get(editorCtx);

    const focusEditorView = () => {
      props.ctx.get(editorViewCtx).focus();
    };

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
        renderSolidApp(TableCreator, ({ destroy }) => ({ ctx: props.ctx, onClose: flow(destroy, focusEditorView) }));
        break;
      case 'topic':
        renderSolidApp(TopicTooltip, ({ destroy }) => ({ ctx: props.ctx, onClose: flow(destroy, focusEditorView) }));
        break;
      case 'link':
        renderSolidApp(LinkTooltip, ({ destroy }) => ({
          onClose: flow(destroy, focusEditorView),
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
      ref={mergeRefs(setMenuRef, setTooltipEl)}
      onSelect={onSelect}
      menu={menu()}
    />
  );
}
