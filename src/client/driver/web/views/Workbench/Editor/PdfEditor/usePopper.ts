import type { VirtualElement } from '@popperjs/core';
import noop from 'lodash/noop';
import { useState, useCallback } from 'react';
import { usePopper } from 'react-popper';

const isTextNode = (node: Node): node is Text => node.nodeType === document.TEXT_NODE;

const isElement = (node: Node): node is HTMLElement => node.nodeType === document.ELEMENT_NODE;

const isVisible = (node: Node) =>
  isElement(node) ? node === document.body || Boolean(node.offsetParent) : Boolean(node.parentElement?.offsetParent);

const SUSPICIOUS_EMPTY_STRING_REGEX = /^\s{5,}$/;

function getSelectionEndPosition(selection: Selection) {
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

  const rect = tmpEl.getBoundingClientRect();
  const x = rect.left;
  const y = rect.top;

  tmpEl.remove();

  return { x, y } as const;
}

export default function () {
  const [referenceElement, setReferenceElement] = useState<VirtualElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {});

  const update = useCallback(() => {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    const { x, y } = getSelectionEndPosition(selection);

    setReferenceElement({
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        top: y,
        right: x,
        bottom: y,
        left: x,
        x,
        y,
        toJSON: noop,
      }),
    });

    if (popperElement) {
      popperElement.hidden = false;
    }
  }, [popperElement]);

  const hide = useCallback(() => {
    if (popperElement) {
      popperElement.hidden = true;
    }
    setReferenceElement(null);
  }, [popperElement]);

  return { setPopperElement, hide, styles, attributes, update };
}
