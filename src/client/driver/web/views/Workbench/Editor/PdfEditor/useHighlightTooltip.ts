import { useCallback, useMemo, useState } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { usePopper } from 'react-popper';
import type { OffsetsFunction } from '@popperjs/core/lib/modifiers/offset';

const isTextNode = (node: Node): node is Text => node.nodeType === document.TEXT_NODE;

const isElement = (node: Node): node is HTMLElement => node.nodeType === document.ELEMENT_NODE;

const isVisible = (node: Node) =>
  isElement(node) ? node === document.body || Boolean(node.offsetParent) : Boolean(node.parentElement?.offsetParent);

const SUSPICIOUS_EMPTY_STRING_REGEX = /^\s{5,}$/;

function getPageFromEndElement(el: HTMLElement | null) {
  let currentEl: HTMLElement | null = el;

  while (currentEl) {
    if (currentEl.dataset.pageNumber) {
      return Number(currentEl.dataset.pageNumber);
    }

    currentEl = currentEl.parentElement;
  }

  return null;
}

function getSelectionEndElement(selection: Selection) {
  const range = selection.getRangeAt(0).cloneRange();
  let collapseToStart = (() => {
    const { focusNode, focusOffset, anchorNode, anchorOffset } = selection;

    if (focusNode === anchorNode) {
      return focusOffset < anchorOffset;
    }

    if (!anchorNode || !focusNode) {
      throw new Error('no anchorNode / focusNode');
    }

    return Boolean(anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_PRECEDING);
  })();

  if (range.endOffset === 0) {
    const walker = document.createTreeWalker(range.commonAncestorContainer);
    let currentNode: Node | null = walker.currentNode;
    let textNode: Text | undefined | null = null;

    while (currentNode) {
      if (currentNode === range.endContainer) {
        break;
      }

      if (
        range.startContainer === currentNode ||
        range.startContainer.compareDocumentPosition(currentNode) & Node.DOCUMENT_POSITION_FOLLOWING
      ) {
        if (isElement(currentNode) && !isVisible(currentNode)) {
          currentNode = walker.nextSibling();

          if (!currentNode) {
            walker.parentNode();
            currentNode = walker.nextSibling();
          }

          continue;
        }

        if (isTextNode(currentNode) && currentNode.textContent) {
          if (SUSPICIOUS_EMPTY_STRING_REGEX.test(currentNode.textContent)) {
            break;
          }

          if (currentNode.textContent.length > 0) {
            textNode = currentNode;
          }
        }
      }

      currentNode = walker.nextNode();
    }

    if (textNode) {
      range.setEndAfter(textNode);
    } else {
      range.setEndBefore(range.endContainer);
    }
    collapseToStart = false;
  }

  const tmpEl = document.createElement('span');

  range.collapse(collapseToStart);
  range.insertNode(tmpEl);
  tmpEl.style.height = '1em';

  return { el: tmpEl, collapseToStart };
}

export default function () {
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [collapseToStart, setCollapseToStart] = useState<boolean>(false);
  const offsetFn = useCallback<OffsetsFunction>(
    ({ popper, reference }) => {
      return [popper.x, popper.y + (collapseToStart ? -reference.height - popper.height * 2 : reference.height / 2)];
    },
    [collapseToStart],
  );

  const popperOptions = useMemo(
    () =>
      ({
        placement: 'bottom',
        modifiers: [{ name: 'offset', options: { offset: offsetFn } }],
      } as const),
    [offsetFn],
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, popperOptions);

  const show = useDebounceFn(
    () => {
      const selection = window.getSelection();

      if (!selection) {
        return;
      }

      const { el, collapseToStart } = getSelectionEndElement(selection);

      setReferenceElement(el);
      setCollapseToStart(collapseToStart);

      if (popperElement) {
        popperElement.hidden = false;
      }
    },
    { wait: 300 },
  );

  const hide = useLatest(() => {
    if (popperElement) {
      popperElement.hidden = true;
    }

    if (referenceElement) {
      referenceElement.remove();
      setReferenceElement(null);
    }
  });

  const page = useMemo(() => getPageFromEndElement(referenceElement), [referenceElement]);

  return { setPopperElement, page, hide, styles, attributes, show };
}
