import { z } from 'zod';
import { markRange, removeMarks } from '#third-party/text-fragments-polyfill/text-fragment-utils';
import { action, observable } from 'mobx';
import assert from 'assert';
import { debounce, omit } from 'lodash-es';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';

import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';
import { IS_DEV } from '#domain/shared/infra/env';
import type { default as PdfViewer, Position } from '../PDFViewer';

interface CommentEditor {
  content: string;
  marks?: Element[];
}

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  private rootEl?: HTMLElement;

  @observable public accessor isVisible = false;

  private current?: {
    text: string;
    position: Required<Position>;
    referenceElement?: HTMLElement;
    dispose?: () => void;
  };

  @observable.ref public accessor commentEditor: CommentEditor | undefined;

  private readonly uiState = new PersistedObject('pdf-selection', z.object({ color: z.string() }), { color: 'yellow' });

  public activate(rootEl: HTMLElement) {
    this.rootEl = rootEl;

    if (this.commentEditor) {
      this.openCommentEditor();
    }

    document.addEventListener('selectionchange', this.handleSelection.bind(this));
  }

  public deactivate() {
    if (this.current) {
      this.current.dispose?.();
      this.current.dispose = undefined;
      this.current.referenceElement = undefined;
    }

    if (this.commentEditor) {
      this.commentEditor.marks = undefined;
    }

    this.show.cancel();
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  private readonly handleSelection = () => {
    if (this.commentEditor) {
      return;
    }

    const s = window.getSelection();

    if (
      !s ||
      !s.focusNode ||
      !s.anchorNode ||
      !this.pdfViewer.viewerElement?.contains(s.anchorNode) ||
      !this.pdfViewer.viewerElement.contains(s.focusNode) ||
      s.isCollapsed ||
      s.rangeCount !== 1
    ) {
      this.hide();
    } else {
      this.show();
    }
  };

  public get color() {
    return this.uiState.get('color');
  }

  public setColor(color: string) {
    this.uiState.set('color', color);
  }

  @action
  public openCommentEditor() {
    assert(this.current);
    const currentRange = this.pdfViewer.positionToRange(this.current.position);
    const marks = markRange(currentRange);

    for (const mark of marks) {
      (mark as HTMLElement).style.backgroundColor = this.color;
      (mark as HTMLElement).style.color = 'transparent';
      (mark as HTMLElement).style.opacity = '0.4';
    }

    this.isVisible = false;
    this.commentEditor = {
      content: this.commentEditor?.content || '',
      marks,
    };
  }

  @action
  public closeCommentEditor(clearSelection?: boolean) {
    assert(this.commentEditor?.marks && this.current?.position);
    removeMarks(this.commentEditor.marks);

    if (!clearSelection) {
      const currentRange = this.pdfViewer.positionToRange(this.current.position);
      this.isVisible = true;

      assert(this.current);
      const s = window.getSelection();

      if (s) {
        // 这两行将立刻分别触发 handleSelection
        // 因此我们把删除 commentEditor 放在最后，这样 handleSection 就会立刻 return
        s.removeAllRanges();
        s.addRange(currentRange);
      }
    }

    this.commentEditor = undefined;
  }

  @action
  public setCommentContent(value: string) {
    assert(this.commentEditor);
    this.commentEditor.content = value;
  }

  public async highlight() {
    assert(this.current);

    await this.pdfViewer.editor.annotation.create({
      color: this.uiState.get('color'),
      body: this.commentEditor?.content,
      selector: {
        type: 'PDFTextPositionSelector',
        fullText: this.current.text,
        position: omit(this.current.position, ['toStart']),
      },
    });

    if (this.commentEditor) {
      this.closeCommentEditor(true);
    }

    this.hide(true);
  }

  @action
  private hide(removeSelection?: boolean) {
    if (!this.current) {
      return;
    }

    this.current.dispose?.();
    this.current.dispose = undefined;

    this.current.referenceElement?.remove();
    this.current.referenceElement = undefined;

    this.show.cancel();

    this.isVisible = false;
    this.current = undefined;

    if (removeSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private readonly show = debounce(
    action(() => {
      if (this.current) {
        this.current.dispose?.();
        this.current.referenceElement?.remove();
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

      startNode.parentElement.normalize();
      endNode.parentElement.normalize();

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
        position: {
          ...this.rangeToPosition(range),
          toStart,
        },
        // 这个应当发生在读取 startOffset / endOffset 后，否则这两个数据就不准了（referenceElement 元素的插入会改变这两个值）
        ...this.generateReferenceElement(range, toStart),
      };

      this.isVisible = true;
    }),
    500,
  );

  private generateReferenceElement(range: Range, toStart: boolean) {
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

      const textLayer = this.pdfViewer.getPageTextLayerElement(page);
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
