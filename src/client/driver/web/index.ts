import { Editor, defaultValueCtx } from '@milkdown/core';
import { gfm } from '@milkdown/preset-gfm';

Editor.make()
  .config((ctx) => {
    ctx.set(defaultValueCtx, '# Milkdown Hello world!');
  })
  .use(gfm)
  .create();
