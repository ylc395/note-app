import type { Ctx } from '@milkdown/kit/ctx';
import { editorViewCtx } from '@milkdown/kit/core';
import { getMarkdown } from '@milkdown/kit/utils';
import { createSignal, onCleanup } from 'solid-js';

const RESET_DELAY = 2000;

export function useCopyAsMarkdown(ctx: Ctx) {
  const [copied, setCopied] = createSignal(false);

  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(resetTimer));

  function copyAsMarkdown() {
    const { from, to } = ctx.get(editorViewCtx).state.selection;
    const markdown = getMarkdown({ from, to })(ctx);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => setCopied(false), RESET_DELAY);
  }

  return { copied, copyAsMarkdown };
}
