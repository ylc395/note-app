import { debounce } from 'lodash-es';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { MessageSquareMoreIcon, PaintbrushIcon } from 'lucide-solid';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';

import type PdfViewer from './PDFViewer';
import Selection from './Selection';

export default function SelectionTooltip(props: { viewer: PdfViewer }) {
  let tooltipRef: HTMLDivElement | undefined;
  let referenceElement: HTMLSpanElement | undefined;
  let placement: 'top' | 'bottom' | undefined;

  const [getReference, setReference] = createSignal<HTMLElement>();
  const debouncedSetReference = debounce(setReference, 500);
  const selection = new Selection(props.viewer);

  function handleSelection() {
    const selection = window.getSelection();

    if (
      !selection ||
      !selection.focusNode ||
      !selection.anchorNode ||
      !props.viewer.viewerElement?.contains(selection.anchorNode) ||
      !props.viewer.viewerElement.contains(selection.focusNode) ||
      selection.isCollapsed ||
      selection.rangeCount !== 1
    ) {
      setReference(undefined);
      return;
    }

    let toStart: boolean;

    if (selection.anchorNode === selection.focusNode) {
      toStart = selection.anchorOffset > selection.focusOffset;
      placement = toStart ? 'top' : 'bottom';
    } else {
      toStart = Boolean(
        selection.focusNode.compareDocumentPosition(selection.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      placement = toStart ? 'top' : 'bottom';
    }

    referenceElement = document.createElement('span');
    referenceElement.style.height = '1em';
    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(toStart);
    range.insertNode(referenceElement);

    debouncedSetReference(referenceElement);
  }

  document.addEventListener('selectionchange', handleSelection);

  createEffect(() => {
    const reference = getReference();

    if (!reference || !tooltipRef) {
      return;
    }

    const stopAutoUpdate = autoUpdate(reference, tooltipRef, () => {
      computePosition(reference, tooltipRef, {
        placement,
        middleware: [flip(), offset(5)],
      }).then(({ x, y }) => {
        Object.assign(tooltipRef.style, { left: `${x}px`, top: `${y}px` });
      });
    });

    onCleanup(stopAutoUpdate);
  });

  onCleanup(() => {
    referenceElement?.remove();
    debouncedSetReference.cancel();
    document.removeEventListener('selectionchange', handleSelection);
  });

  async function highlight() {
    await selection.highlight();
    setReference(undefined);
  }

  return (
    <Show when={getReference()}>
      <div ref={tooltipRef} class="flex absolute space-x-2 bg-white py-2 px-1 rounded shadow-md z-50">
        <button>
          <span class="block w-4 h-4 border" style={{ 'background-color': selection.uiState.get('color') }}></span>
        </button>
        <button class="flex items-center" onClick={highlight}>
          <PaintbrushIcon />
        </button>
        <button class="flex items-center">
          <MessageSquareMoreIcon />
        </button>
      </div>
    </Show>
  );
}
