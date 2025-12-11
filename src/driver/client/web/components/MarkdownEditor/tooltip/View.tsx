import { Ctx } from '@milkdown/kit/ctx';
import { BoldIcon, ItalicIcon, StrikethroughIcon, CodeIcon, LinkIcon } from 'lucide-solid';
import { toggleEmphasisCommand, toggleInlineCodeCommand, toggleStrongCommand } from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import type { $Command } from '@milkdown/kit/utils';

export default function View(props: { ctx: Ctx }) {
  const command = props.ctx.get(commandsCtx);
  const editorView = props.ctx.get(editorViewCtx);

  function callCommand({ key }: $Command<unknown>) {
    command.call(key);
    editorView.focus();
  }

  return (
    <>
      <button onClick={() => callCommand(toggleEmphasisCommand)}>
        <ItalicIcon />
      </button>
      <button onClick={() => callCommand(toggleStrongCommand)}>
        <BoldIcon />
      </button>
      <button onClick={() => callCommand(toggleStrikethroughCommand)}>
        <StrikethroughIcon />
      </button>
      <button onClick={() => callCommand(toggleInlineCodeCommand)}>
        <CodeIcon />
      </button>
      <button>
        <LinkIcon />
      </button>
    </>
  );
}
