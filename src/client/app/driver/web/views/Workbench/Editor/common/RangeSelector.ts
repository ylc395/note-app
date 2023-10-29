import debounce from 'lodash/debounce';
import { IS_DEV } from 'infra/constants';
import { isTextNode, isElement, isVisible } from './domUtils';

export interface RangeSelectEvent {
  el: HTMLSpanElement;
  collapseToStart: boolean;
  range: Range;
}

interface Options {
  onTextSelectionChanged: (e: RangeSelectEvent | null) => void;
  rootEl: HTMLElement | DocumentFragment;
}

export default class RangeSelector {
  constructor(protected readonly options: Options) {
    document.addEventListener('selectionchange', this.handleSelection);
  }

  private markEl?: HTMLElement;

  private static isEndAtStart(selection: Selection) {
    const { focusNode, focusOffset, anchorNode, anchorOffset } = selection;

    if (focusNode === anchorNode) {
      return focusOffset < anchorOffset;
    }

    if (!anchorNode || !focusNode) {
      throw new Error('no anchorNode / focusNode');
    }

    return Boolean(anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_PRECEDING);
  }

  static getTextFromRange(range: Range) {
    return Array.from(range.cloneContents().childNodes)
      .map((el) => el.textContent)
      .join('');
  }

  private getSelectionRange() {
    // fixme: `shadowRoot.getSelection()` is not a standard API. But standard API `selection.getComposedRange()` is not shipped yet.
    const selection = (
      this.options.rootEl instanceof ShadowRoot ? (this.options.rootEl as unknown as Window) : window
    ).getSelection?.();

    if (
      !selection ||
      selection.rangeCount > 1 ||
      // we don't use `selection.isCollapsed` here because there is chrome bug in shadowRoot's `selection.isCollapsed`(always true)
      (selection.anchorNode === selection.focusNode && selection.anchorOffset === selection.focusOffset) ||
      !this.options.rootEl.contains(selection.anchorNode) ||
      !this.options.rootEl.contains(selection.focusNode)
    ) {
      return null;
    }

    return {
      range: selection.getRangeAt(0),
      isEndAtStart: RangeSelector.isEndAtStart(selection),
    };
  }

  private readonly handleSelection = () => {
    const range = this.getSelectionRange();
    this.removeMarkEl();

    if (range) {
      this.updateRangeEnd(range);
    } else {
      this.updateRangeEnd.cancel();
      this.options.onTextSelectionChanged?.(null);
    }
  };

  private readonly updateRangeEnd = debounce((range: { range: Range; isEndAtStart: boolean }) => {
    const rangeEnd = RangeSelector.getRangeEnd(range);
    this.options.onTextSelectionChanged?.({ ...rangeEnd, range: range.range });
    this.markEl = rangeEnd.el;
  }, 300);

  private removeMarkEl() {
    this.markEl?.remove();
    this.markEl = undefined;
  }

  destroy() {
    this.removeMarkEl();
    this.updateRangeEnd.cancel();
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  private static getRangeEnd(result: { range: Range; isEndAtStart: boolean }) {
    const range = result.range.cloneRange();
    let collapseToStart = result.isEndAtStart;
    const endContainer = RangeSelector.getValidEndContainer(range);

    if (isTextNode(endContainer) && range.endContainer !== endContainer) {
      range.setEndAfter(endContainer);
      collapseToStart = false;
    }

    const tmpEl = document.createElement('span');

    range.collapse(collapseToStart);
    range.insertNode(tmpEl);
    tmpEl.style.height = '1em';

    if (IS_DEV) {
      tmpEl.className = 'selection-end-mark';
    }

    return { el: tmpEl, collapseToStart };
  }

  // when double click an element to select text, `endOffset` often comes with 0 and `endContainer` is not correct
  // we should find the right endContainer
  static getValidEndContainer = (range: Range) => {
    const SUSPICIOUS_EMPTY_STRING_REGEX = /^\s{5,}$/;

    if (range.endOffset !== 0) {
      return range.endContainer;
    }

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

    return textNode || range.endContainer;
  };
}
