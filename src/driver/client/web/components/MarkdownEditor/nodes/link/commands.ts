import { $command } from '@milkdown/kit/utils';
import { render, createComponent } from 'solid-js/web';
import { editorViewCtx } from '@milkdown/kit/core';

import shell from '#web/infra/shell';
import Tooltip, { Mode } from './tooltip/View';

export const editNewLinkCommand = $command('editNewLinkCommand', (ctx) => () => () => {
  const container = document.createElement('div');
  shell.appRoot.append(container);
  const dispose = render(() => createComponent(Tooltip, { onClose: destroy, ctx, initialMode: Mode.Add }), container);

  function destroy() {
    const editorView = ctx.get(editorViewCtx);
    dispose();
    container.remove();
    editorView.focus();
  }

  return true;
});
