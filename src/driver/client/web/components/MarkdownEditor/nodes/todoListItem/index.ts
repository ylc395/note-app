import { extendListItemSchemaForTask } from '@milkdown/kit/preset/gfm';
import { wrapIn } from '@milkdown/kit/prose/commands';
import type { NodeViewConstructor } from '@milkdown/kit/prose/view';
import { $command, $view } from '@milkdown/kit/utils';
import { createComponent, createSignal } from 'solid-js';
import { render } from 'solid-js/web';

import View from './TogglerView';

const todoListNodeView = $view(extendListItemSchemaForTask.node, (): NodeViewConstructor => {
  return (initialNode, editorView, getNodePos) => {
    const dom = document.createElement('li');
    const contentDOM = document.createElement('div');
    const togglerContainer = document.createElement('span');
    const [attrs, setAttrs] = createSignal(initialNode.attrs);
    const dispose = render(
      () =>
        createComponent(View, {
          get checked() {
            return attrs().checked;
          },
          onToggle: handleToggle,
        }),
      togglerContainer,
    );

    dom.className = 'flex items-start';
    togglerContainer.contentEditable = 'false';

    if (attrs().checked != null) {
      dom.append(togglerContainer);
    }

    dom.append(contentDOM);

    function handleToggle(value: boolean) {
      const pos = getNodePos();

      if (pos) {
        editorView.dispatch(editorView.state.tr.setNodeAttribute(pos, 'checked', value));
      }
    }

    return {
      dom,
      contentDOM,
      update: (node) => {
        setAttrs(node.attrs);

        if (node.attrs.checked == null && dom.contains(togglerContainer)) {
          togglerContainer.remove();
        }

        if (node.attrs.checked !== null && !dom.contains(togglerContainer)) {
          dom.insertBefore(togglerContainer, contentDOM);
        }

        return true;
      },
      destroy: () => {
        dispose();
        dom.remove();
      },
    };
  };
});

export const wrapInTodoListItem = $command(
  'WrapInTodoListItem',
  (ctx) => (attr?: { listType?: 'ordered' | 'bullet' }) =>
    wrapIn(extendListItemSchemaForTask.type(ctx), { checked: false, ...attr }),
);

export default [wrapInTodoListItem, todoListNodeView].flat();
