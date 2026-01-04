import { $command } from '@milkdown/kit/utils';
import { render, createComponent } from 'solid-js/web';
import { editorViewCtx } from '@milkdown/kit/core';

import shell from '#web/infra/shell';
import Tooltip from './Tooltip';

export const editTopicCommand = $command('editTopicCommand', (ctx) => (topicDom?: HTMLElement) => () => {
  const container = document.createElement('div');
  shell.appRoot.append(container);
  const dispose = render(() => createComponent(Tooltip, { onDestroy: destroy, ctx, targetDom: topicDom }), container);

  function destroy() {
    const editorView = ctx.get(editorViewCtx);
    dispose();
    container.remove();
    editorView.focus();
  }

  return true;
});
