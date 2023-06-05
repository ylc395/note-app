import { isTextNode, isElement, isVisible } from './domUtils';

export interface Options {
  onTextSelected?: () => void;
  onTextSelectCancel?: () => void;
}

export default abstract class RangeSelectable {
  constructor(protected readonly options: Options) {
    document.addEventListener('selectionchange', this.handleSelection);
  }

  protected abstract rootEl: HTMLElement | null | undefined;

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

  protected static getTextFromRange(range: Range) {
    return Array.from(range.cloneContents().childNodes)
      .map((el) => el.textContent)
      .join('');
  }

  protected getSelectionRange() {
    const selection = window.getSelection();

    if (
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount > 1 ||
      !this.rootEl ||
      !this.rootEl.contains(selection.anchorNode) ||
      !this.rootEl.contains(selection.focusNode)
    ) {
      return null;
    }

    return {
      range: selection.getRangeAt(0),
      isEndAtStart: RangeSelectable.isEndAtStart(selection),
    };
  }

  private readonly handleSelection = () => {
    if (this.getSelectionRange()) {
      this.options.onTextSelected?.();
    } else {
      this.options.onTextSelectCancel?.();
    }
  };

  protected destroy() {
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  getSelectionEnd() {
    const result = this.getSelectionRange();

    if (!result) {
      return;
    }

    const range = result.range.cloneRange();
    let collapseToStart = result.isEndAtStart;
    const endContainer = RangeSelectable.getValidEndContainer(range);

    if (isTextNode(endContainer) && range.endContainer !== endContainer) {
      range.setEndAfter(endContainer);
      collapseToStart = false;
    }

    const tmpEl = document.createElement('span');

    range.collapse(collapseToStart);
    range.insertNode(tmpEl);
    tmpEl.style.height = '1em';

    if (__ENV__ === 'dev') {
      tmpEl.className = 'selection-end-mark';
    }

    return { el: tmpEl, collapseToStart };
  }

  // when double click an element to select text, `endOffset` often comes with 0 and `endContainer` is not correct
  // we should find the right endContainer
  protected static getValidEndContainer = (range: Range) => {
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
