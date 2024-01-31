import { IS_DEV } from '@shared/domain/infra/constants';
import { isTextNode, isVisible } from './domUtils';
import assert from 'assert';
import { debounce } from 'lodash-es';

export interface RangeSelectEvent {
  markEl: HTMLSpanElement; // a temporary <span> element used as a floating ref
  markElPosition: 'start' | 'end';
  range: Range;
}

interface Options {
  onChange: (e: RangeSelectEvent | null) => void;
  rootEl?: HTMLElement | DocumentFragment;
  includes?: (startContainer: Node, endContainer: Node) => boolean;
}

export default class RangeSelector {
  constructor(protected readonly options: Options) {
    document.addEventListener('selectionchange', this.handleSelection);
  }

  private markEl?: HTMLSpanElement;

  private getSelection() {
    const rootNode = this.options.rootEl?.getRootNode();
    const selection =
      rootNode instanceof ShadowRoot && 'getSelection' in rootNode
        ? // fixme: `shadowRoot.getSelection()` is not a standard API. But standard API `selection.getComposedRange()` is not shipped yet.
          (rootNode as unknown as Window).getSelection()
        : window.getSelection();

    return selection;
  }

  private getRange() {
    const selection = this.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const { rootEl, includes } = this.options;

    if (
      !selection.focusNode ||
      !selection.anchorNode ||
      selection.rangeCount > 1 ||
      // `selection.isCollapsed is buggy in shadow dom, so we don't use it`
      (selection.anchorNode === selection.focusNode && selection.anchorOffset === selection.focusOffset) ||
      (rootEl && !(rootEl.contains(range.endContainer) && rootEl.contains(range.startContainer))) ||
      (includes && !includes(range.startContainer, range.endContainer))
    ) {
      return null;
    }

    return range;
  }

  private readonly handleSelection = () => {
    this.removeMarkEl();
    const ranges = this.getRange();

    if (!ranges) {
      this.options.onChange?.(null);
      this.notifyRange.cancel();
    } else {
      this.notifyRange(ranges);
    }
  };

  private readonly notifyRange = debounce((range: Range) => {
    const { markEl, position } = this.generateMarkEl(range);
    this.markEl = markEl;
    this.options.onChange?.({ range, markEl, markElPosition: position });
  }, 300);

  private removeMarkEl() {
    this.markEl?.remove();
    this.markEl = undefined;
  }

  public destroy() {
    this.removeMarkEl();
    this.notifyRange.cancel();
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  private generateMarkEl(range: Range) {
    const selection = this.getSelection();
    assert(selection && selection.focusNode && selection.anchorNode);

    const isFocusStart = Boolean(
      selection.focusNode.compareDocumentPosition(selection.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING,
    );

    let position: 'start' | 'end' = isFocusStart ? 'start' : 'end';
    range = range.cloneRange();
    const correctEndContainer = RangeSelector.getValidEndContainer(range);

    if (isTextNode(correctEndContainer) && range.endContainer !== correctEndContainer) {
      range.setEndAfter(correctEndContainer);
      position = 'end';
    }

    const tmpEl = document.createElement('span');

    range.collapse(isFocusStart);
    range.insertNode(tmpEl);
    tmpEl.style.height = '1em';

    if (IS_DEV) {
      tmpEl.className = 'w-1 bg-red-600';
    }

    return { markEl: tmpEl, position };
  }

  // when double click an element to select text, `endOffset` often comes with 0 and `endContainer` is not correct
  // we should find the right endContainer
  private static getValidEndContainer = (range: Range) => {
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
        if (currentNode instanceof HTMLElement && !isVisible(currentNode)) {
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

  public static getText(range: Range) {
    return Array.from(range.cloneContents().childNodes)
      .map((node) => node.textContent)
      .join('');
  }

  public static clearRange() {
    window.getSelection()?.removeAllRanges();
  }
}
