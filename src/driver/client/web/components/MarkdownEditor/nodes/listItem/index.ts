import { extendListItemSchemaForTask } from '@milkdown/kit/preset/gfm';
import { wrapIn } from '@milkdown/kit/prose/commands';
import type { NodeViewConstructor } from '@milkdown/kit/prose/view';
import { $command, $view } from '@milkdown/kit/utils';
import { createComponent, createSignal } from 'solid-js';
import { render } from 'solid-js/web';

import View from './TogglerView';

const listNodeView = $view(extendListItemSchemaForTask.node, (): NodeViewConstructor => {
  return (initialNode, editorView, getNodePos) => {
    const dom = document.createElement('li');
    const containerDOM = document.createElement('div');
    const contentDOM = document.createElement('div');
    const [attrs, setAttrs] = createSignal(initialNode.attrs);
    let disposeToggler: (() => void) | undefined;

    containerDOM.className = 'flex items-center';
    containerDOM.append(contentDOM);
    dom.append(containerDOM);

    if (attrs().checked != null) {
      disposeToggler = mountToggler();
    }

    function toggle(value: boolean) {
      const pos = getNodePos();

      if (pos) {
        editorView.dispatch(editorView.state.tr.setNodeAttribute(pos, 'checked', value));
      }
    }

    function mountToggler() {
      const togglerContainer = document.createElement('span');
      const dispose = render(
        () =>
          createComponent(View, {
            get checked() {
              return attrs().checked;
            },
            onToggle: toggle,
          }),
        togglerContainer,
      );
      togglerContainer.contentEditable = 'false';
      togglerContainer.className = 'mr-2 -ml-8';
      containerDOM.insertBefore(togglerContainer, contentDOM);

      const itemClassName = 'list-none';
      dom.classList.add(itemClassName);

      return () => {
        dispose();
        dom.classList.remove(itemClassName);
        togglerContainer.remove();
      };
    }

    return {
      dom,
      contentDOM,
      update: (node) => {
        setAttrs(node.attrs);

        if (node.attrs.checked == null && disposeToggler) {
          disposeToggler();
          disposeToggler = undefined;
        }

        if (node.attrs.checked !== null && !disposeToggler) {
          disposeToggler = mountToggler();
        }

        return true;
      },
      destroy: () => {
        disposeToggler?.();
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

export default [wrapInTodoListItem, listNodeView].flat();
