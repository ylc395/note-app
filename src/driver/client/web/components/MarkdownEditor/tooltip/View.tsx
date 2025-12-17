import { Ctx } from '@milkdown/kit/ctx';
import { BoldIcon, ItalicIcon, StrikethroughIcon, CodeIcon, LinkIcon } from 'lucide-solid';
import { toggleEmphasisCommand, toggleInlineCodeCommand, toggleStrongCommand } from '@milkdown/kit/preset/commonmark';
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm';
import { editorCtx, editorViewCtx } from '@milkdown/kit/core';
import { callCommand, type $Command } from '@milkdown/kit/utils';

import { createLinkCommand } from '../link';

export default function View(props: { ctx: Ctx }) {
  const editor = props.ctx.get(editorCtx);
  const editorView = props.ctx.get(editorViewCtx);

  function action(command: $Command<unknown>) {
    return () => {
      editor.action(callCommand(command.key));
      editorView.focus();
    };
  }

  return (
    <>
      <button onClick={action(toggleEmphasisCommand)}>
        <ItalicIcon />
      </button>
      <button onClick={action(toggleStrongCommand)}>
        <BoldIcon />
      </button>
      <button onClick={action(toggleStrikethroughCommand)}>
        <StrikethroughIcon />
      </button>
      <button onClick={action(toggleInlineCodeCommand)}>
        <CodeIcon />
      </button>
      <button onClick={action(createLinkCommand)}>
        <LinkIcon />
      </button>
    </>
  );
}
