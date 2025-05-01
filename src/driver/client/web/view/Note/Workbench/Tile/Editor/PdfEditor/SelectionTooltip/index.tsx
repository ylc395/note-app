import { debounce } from 'lodash-es';
import { createEffect, For, onCleanup, Show } from 'solid-js';
import { ChevronDown, MessageSquareMoreIcon, PaintbrushIcon } from 'lucide-solid';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { Menu } from '@ark-ui/solid';
import { markRange, removeMarks } from '#third-party/text-fragments-polyfill/text-fragment-utils';

import type PdfViewer from '../PDFViewer';
import SelectionModel from './Selection';
import CommentInput from './CommentInput';
import { IS_DEV } from '#domain/shared/infra/env';
import assert from 'assert';

export default function SelectionTooltip(props: { viewer: PdfViewer }) {
  let tooltipRef: HTMLDivElement | undefined;
  let referenceElement: HTMLSpanElement | undefined;
  let placement: 'top' | 'bottom' | undefined;
  const selection = new SelectionModel(props.viewer);

  const setVisibleDebounced = debounce((s: Selection) => {
    assert(s.focusNode && s.anchorNode);

    let toStart: boolean;

    if (s.anchorNode === s.focusNode) {
      toStart = s.anchorOffset > s.focusOffset;
      placement = toStart ? 'top' : 'bottom';
    } else {
      toStart = Boolean(s.focusNode.compareDocumentPosition(s.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING);
      placement = toStart ? 'top' : 'bottom';
    }

    referenceElement?.remove();
    referenceElement = document.createElement('span');
    referenceElement.style.height = '1em';

    if (IS_DEV) {
      referenceElement.style.width = '1px';
      referenceElement.style.backgroundColor = 'black';
    }

    selection.current = {
      range: s.getRangeAt(0),
      focusNode: s.focusNode,
    };

    // if (selection.current.range.startContainer.nodeType === Node.ELEMENT_NODE) {
    //   selection.current.range.setStartAfter(selection.current.range.startContainer);
    // }

    // if (selection.current.range.endContainer.nodeType === Node.ELEMENT_NODE) {
    //   selection.current.range.setEndBefore(selection.current.range.endContainer);
    // }

    const range = selection.current.range.cloneRange();

    range.collapse(toStart);
    range.insertNode(referenceElement);

    selection.setVisibility(true);
  }, 500);

  function getValidSelection() {
    const s = window.getSelection();

    if (
      !s ||
      !s.focusNode ||
      !s.anchorNode ||
      !props.viewer.viewerElement?.contains(s.anchorNode) ||
      !props.viewer.viewerElement.contains(s.focusNode) ||
      s.isCollapsed ||
      s.rangeCount !== 1
    ) {
      return null;
    }

    return s as Selection & { focusNode: NonNullable<Selection['focusNode']> };
  }

  function handleSelection() {
    if (selection.comment.isVisible) {
      return;
    }

    const s = getValidSelection();

    if (!s) {
      selection.setVisibility(false);
      setVisibleDebounced.cancel();
      return;
    }

    selection.setVisibility(false);
    setVisibleDebounced(s);
  }

  document.addEventListener('selectionchange', handleSelection);

  createEffect(() => {
    if (!(selection.isVisible || selection.comment.isVisible) || !referenceElement || !tooltipRef) {
      return;
    }

    const stopAutoUpdate = autoUpdate(referenceElement, tooltipRef, () => {
      computePosition(referenceElement!, tooltipRef, {
        placement,
        middleware: [flip(), offset(5)],
      }).then(({ x, y }) => {
        Object.assign(tooltipRef.style, { left: `${x}px`, top: `${y}px` });
      });
    });

    onCleanup(stopAutoUpdate);
  });

  createEffect(() => {
    if (!selection.comment.isVisible && !selection.isVisible) {
      referenceElement?.remove();
    }

    if (selection.comment.isVisible && selection.current?.range) {
      const marks = markRange(selection.current.range.cloneRange());

      for (const mark of marks) {
        (mark as HTMLElement).style.backgroundColor = selection.color;
        (mark as HTMLElement).style.backgroundColor = selection.color;
        (mark as HTMLElement).style.color = 'transparent';
        (mark as HTMLElement).style.opacity = '0.4';
      }

      onCleanup(() => {
        removeMarks(marks);
      });
    }

    if (selection.isVisible && selection.current?.range && !getValidSelection()) {
      const s = window.getSelection();

      if (s) {
        s.removeAllRanges();
        s.addRange(selection.current.range);
      }
    }
  });

  onCleanup(() => {
    referenceElement?.remove();
    setVisibleDebounced.cancel();
    document.removeEventListener('selectionchange', handleSelection);
  });

  return (
    <div ref={tooltipRef} class="absolute">
      <Show when={selection.isVisible}>
        <div class="flex space-x-2 bg-white py-2 px-1 rounded shadow-md z-50">
          <Menu.Root
            lazyMount
            unmountOnExit
            positioning={{ placement: 'bottom' }}
            onSelect={(e) => selection.setColor(e.value)}
          >
            <Menu.Trigger>
              <button class="flex">
                <span class="w-4 h-4 border" style={{ 'background-color': selection.color }}></span>
                <ChevronDown />
              </button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content class="flex border">
                <For each={['yellow', 'red', 'blue', 'green']}>
                  {(color) => (
                    <Menu.Item
                      class="w-4 h-4 cursor-pointer border"
                      value={color}
                      style={{ 'background-color': color }}
                    />
                  )}
                </For>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
          <button class="flex items-center" onClick={() => selection.highlight()}>
            <PaintbrushIcon />
          </button>
          <button onClick={() => selection.setCommentVisibility(true, true)} class="flex items-center">
            <MessageSquareMoreIcon />
          </button>
        </div>
      </Show>
      <Show when={selection.comment.isVisible}>
        <CommentInput selection={selection} />
      </Show>
    </div>
  );
}
