import { action, computed, reaction } from 'mobx';
import assert from 'assert';
import { debounce, intersection, omit, range } from 'lodash-es';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';

import { IS_DEV } from '#domain/shared/infra/env';
import type { Position } from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import type { SelectionState } from '#domain/client/app/model/note/editor/PdfEditor/selectionState';
import CommentEditor from './CommentEditor';
import type PDFEditorViewer from '../../../PDFEditorViewer';

export default class Selection {
  public readonly commentEditor: CommentEditor;

  constructor(private readonly pdfViewer: PDFEditorViewer) {
    this.commentEditor = new CommentEditor({
      pdfViewer: this.pdfViewer,
      onSubmit: this.highlight.bind(this),
    });
  }

  private rootEl?: HTMLElement;

  private readonly abortController = new AbortController();

  @computed
  private get current() {
    return this.pdfViewer.editor.selection;
  }

  @action
  private set current(value: SelectionState | undefined) {
    this.pdfViewer.editor.selection = value;
  }

  @computed
  public get isVisible() {
    return Boolean(this.current);
  }

  @action
  public init(rootEl: HTMLElement) {
    const { current: initialCurrent } = this;

    this.current = undefined;
    this.rootEl = rootEl;
    let initialized = !initialCurrent;

    if (initialized) {
      document.addEventListener('selectionchange', this.handleSelection, { signal: this.abortController.signal });
    }

    reaction(
      () => this.pdfViewer.viewer.visiblePages,
      (pages) => {
        const current = initialized ? this.current : initialCurrent;

        if (!current || current.floating?.isActive) {
          return;
        }

        const pageRange = range(current.position.startPage, current.position.endPage + 1);
        const renderedPages = pages.filter((page) => this.pdfViewer.viewer.getPageInfo(page).textLayer);

        if (intersection(pageRange, renderedPages).length === pageRange.length) {
          if (!initialized) {
            document.addEventListener('selectionchange', this.handleSelection, { signal: this.abortController.signal });
          }

          initialized = true;

          const selection = window.getSelection();

          selection?.removeAllRanges();
          selection?.addRange(this.positionToRange(current.position));
        }
      },
      {
        signal: this.abortController.signal,
        fireImmediately: true,
      },
    );
  }

  public destroy() {
    this.hide(false);
    this.abortController.abort();
  }

  private readonly handleSelection = () => {
    // 1. 如果是 commentEditor 触发的（关闭时恢复原生选区），不处理
    // 2. commentEditor 展示中，不处理
    if (this.commentEditor.isOpen) {
      return;
    }

    const s = window.getSelection();
    const range = s?.rangeCount === 1 && s.getRangeAt(0);

    if (
      !s ||
      !s.focusNode ||
      !s.anchorNode ||
      !this.pdfViewer.viewer.viewerElement?.contains(s.anchorNode) ||
      !this.pdfViewer.viewer.viewerElement.contains(s.focusNode) ||
      s.isCollapsed ||
      !range ||
      range.cloneContents().querySelector('mark')
    ) {
      this.hide();
    } else {
      this.showByDomSelection();
    }
  };

  public get color() {
    return this.pdfViewer.editor.newAnnotationColor;
  }

  @action
  public setColor(color: string) {
    this.pdfViewer.editor.newAnnotationColor = color;
  }

  public startComment() {
    assert(this.current?.position);
    this.commentEditor.start(this.current.position);
  }

  public async highlight() {
    assert(this.current);

    await this.pdfViewer.editor.annotation.create({
      body: this.commentEditor?.content,
      selector: {
        type: 'PDFTextPositionSelector',
        fullText: this.current.text,
        position: omit(this.current.position, ['toStart']),
        color: this.color,
      },
    });

    this.hide();
    window.getSelection()?.removeAllRanges();
  }

  @action
  private hide(clearCurrent = true) {
    if (this.current) {
      this.current.floating?.dispose();

      if (clearCurrent) {
        this.current = undefined;
      } else {
        this.current.floating = undefined;
      }
    }

    this.showByDomSelection.cancel();

    if (this.commentEditor.isOpen) {
      this.commentEditor.cancel();
    }
  }

  private readonly showByDomSelection = debounce(
    action(() => {
      const s = window.getSelection();

      if (!s || !s.focusNode || !s.anchorNode) {
        return;
      }

      const range = s.getRangeAt(0);
      const startNode =
        range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer : range.startContainer.firstChild;
      const endNode =
        range.endContainer.nodeType === Node.TEXT_NODE ? range.endContainer : range.endContainer.lastChild;

      if (!startNode || !endNode || !startNode.parentElement || !endNode.parentElement) {
        return;
      }

      let toStart = this.current?.position.toStart;

      if (typeof toStart !== 'boolean') {
        if (s.anchorNode === s.focusNode) {
          toStart = s.anchorOffset > s.focusOffset;
        } else {
          toStart = Boolean(s.focusNode.compareDocumentPosition(s.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING);
        }
      }

      this.current?.floating?.dispose();

      this.current = {
        text: range.toString(),
        floating: this.generateFloating(range, toStart),
        position: {
          ...this.rangeToPosition(range),
          toStart,
        },
      };
    }),
    300,
  );

  private generateFloating(range: Range, toStart: boolean) {
    // 这里曾经试过用 range 来充当 virtual reference element
    // 但是 range 是 live 的，DOM 上的变化会使得 range 非常不稳定（尤其是 DOM 高亮的时候）
    // 最后还是选择使用临时元素充当 reference element
    const referenceElement = document.createElement('span');
    referenceElement.style.height = '1em';

    if (IS_DEV) {
      referenceElement.style.width = '1px';
      referenceElement.style.backgroundColor = 'black';
    }

    const clonedRange = range.cloneRange();
    clonedRange.collapse(toStart);
    clonedRange.insertNode(referenceElement);

    const { rootEl } = this;
    assert(rootEl, 'no rootEl');

    const dispose = autoUpdate(referenceElement, rootEl, () => {
      if (!referenceElement.isConnected) {
        dispose();
        return;
      }

      computePosition(referenceElement, rootEl, {
        placement: toStart ? 'top' : 'bottom',
        middleware: [flip(), offset(5)],
      }).then(({ x, y }) => {
        Object.assign(rootEl.style, { left: `${x}px`, top: `${y}px` });
      });
    });

    return {
      get isActive() {
        return referenceElement.isConnected;
      },

      dispose: () => {
        dispose();
        referenceElement.remove();
      },
    };
  }

  private positionToRange(position: Position) {
    const range = new Range();

    const setBoundary = (page: number, totalOffset: number, isStart?: boolean) => {
      const { textLayer } = this.pdfViewer.viewer.getPageInfo(page);
      assert(textLayer);

      const treeWalker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let currentNode = treeWalker.nextNode() as Text | null;

      while (currentNode) {
        if (currentNode.length + offset >= totalOffset) {
          range[isStart ? 'setStart' : 'setEnd'](currentNode, totalOffset - offset);
          break;
        } else {
          offset += currentNode.length;
          currentNode = treeWalker.nextNode() as Text | null;
        }
      }
    };

    setBoundary(position.startPage, position.startOffset, true);
    setBoundary(position.endPage, position.endOffset);

    return range;
  }

  private rangeToPosition(range: Range) {
    const findPage = (node: Node) => {
      let current: Node | null = node;

      while (current) {
        if (current instanceof HTMLElement && current.dataset.pageNumber) {
          return Number(current.dataset.pageNumber);
        }
        current = current.parentElement;
      }

      assert.fail('can not find page');
    };

    const findIndex = (page: number, node: Node, offset: number, isStart?: boolean) => {
      let targetNextNode = node instanceof Text ? node : isStart ? node.firstChild : node.lastChild;

      if (!(targetNextNode instanceof Text)) {
        targetNextNode = null;
      }

      const { textLayer } = this.pdfViewer.viewer.getPageInfo(page);
      assert(textLayer);

      const treeWalker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
      let currentNode = treeWalker.nextNode() as Text | null;
      let totalOffset = 0;

      while (currentNode) {
        if (targetNextNode ? currentNode === targetNextNode : node.contains(currentNode)) {
          totalOffset += offset;
          return totalOffset;
        }
        totalOffset += currentNode.length;
        currentNode = treeWalker.nextNode() as Text | null;
      }

      assert.fail('can not find offset');
    };

    const startPage = findPage(range.startContainer);
    const endPage = findPage(range.endContainer);

    return {
      startPage,
      endPage,
      startOffset: findIndex(startPage, range.startContainer, range.startOffset, true),
      endOffset: findIndex(endPage, range.endContainer, range.endOffset),
    };
  }
}
