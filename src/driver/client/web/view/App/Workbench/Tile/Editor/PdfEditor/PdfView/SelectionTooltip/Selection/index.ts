import { action, computed, observable } from 'mobx';
import assert from 'assert';
import { debounce, omit } from 'lodash-es';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';

import type { Position } from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import { IS_DEV } from '#domain/shared/infra/env';
import CommentEditor from './CommentEditor';
import type PDFEditorViewer from '../../../PDFEditorViewer';

interface SelectionState {
  text: string;
  position: Required<Position>;
  floating?: {
    referenceElement: HTMLElement;
    dispose: () => void;
  };
}

export default class Selection {
  public readonly commentEditor: CommentEditor;

  constructor(private readonly pdfViewer: PDFEditorViewer) {
    this.commentEditor = new CommentEditor(this.pdfViewer);
  }

  private rootEl?: HTMLElement;

  @observable.ref
  private accessor current: SelectionState | undefined;

  @computed
  public get isVisible() {
    return Boolean(this.current);
  }

  public activate(rootEl: HTMLElement) {
    this.rootEl = rootEl;

    if (this.commentEditor.isOpen) {
      this.commentEditor.start();
    }

    document.addEventListener('selectionchange', this.handleSelection.bind(this));
  }

  public deactivate() {
    if (this.current?.floating) {
      this.current.floating.dispose?.();
      this.current.floating = undefined;
    }

    this.commentEditor.clearMarks();
    this.show.cancel();
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  private readonly handleSelection = () => {
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
      this.show();
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

  public cancelComment() {
    this.commentEditor.cancel();
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

    if (this.commentEditor.isOpen) {
      this.commentEditor.clearMarks();
    }

    this.hide(true);
  }

  @action
  private hide(removeSelection?: boolean) {
    if (!this.current) {
      return;
    }

    this.current.floating?.dispose?.();
    this.current.floating = undefined;

    this.show.cancel();

    this.current = undefined;

    if (removeSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private readonly show = debounce(
    action(() => {
      if (this.current) {
        this.current.floating?.dispose?.();
        this.current.floating = undefined;
      }

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
      computePosition(referenceElement, rootEl, {
        placement: toStart ? 'top' : 'bottom',
        middleware: [flip(), offset(5)],
      }).then(({ x, y }) => {
        Object.assign(rootEl.style, { left: `${x}px`, top: `${y}px` });
      });
    });

    return { dispose, referenceElement };
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
