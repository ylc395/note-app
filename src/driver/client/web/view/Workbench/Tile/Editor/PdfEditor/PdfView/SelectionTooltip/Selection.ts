import { z } from 'zod';
import { action, computed, observable } from 'mobx';
import assert from 'assert';
import { debounce, omit, range, zip } from 'lodash-es';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import Mark from 'mark.js';

import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import {
  default as AnnotationManager,
  type Position,
} from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import { IS_DEV } from '#domain/shared/infra/env';
import type PdfViewer from '../PDFViewer';

interface CommentEditor {
  content: string;
  markers?: Mark[];
}

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  private rootEl?: HTMLElement;

  @observable private accessor _isTooltipVisible = false;

  @computed public get isTooltipVisible() {
    return this._isTooltipVisible && !this.pdfViewer.editor.annotation.svgEditor.isEnabled;
  }

  private current?: {
    text: string;
    position: Required<Position>;
    referenceElement?: HTMLElement;
    stopAutoUpdate?: () => void;
  };

  @observable.ref private accessor commentEditor: CommentEditor | undefined;

  @computed public get isCommentEditorVisible() {
    return Boolean(this.commentEditor) && !this.pdfViewer.editor.annotation.svgEditor.isEnabled;
  }

  private readonly uiState = new PersistedMap('pdf-selection', z.object({ color: z.string().catch('yellow') }));

  public activate(rootEl: HTMLElement) {
    this.rootEl = rootEl;

    if (this.commentEditor) {
      this.openCommentEditor();
    }

    document.addEventListener('selectionchange', this.handleSelection.bind(this));
  }

  public deactivate() {
    if (this.current) {
      this.current.stopAutoUpdate?.();
      this.current.stopAutoUpdate = undefined;
      this.current.referenceElement = undefined;
    }

    if (this.commentEditor) {
      this.commentEditor.markers = undefined;
    }

    this.show.cancel();
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  private readonly handleSelection = () => {
    if (this.commentEditor) {
      return;
    }

    const s = window.getSelection();
    const range = s?.rangeCount === 1 && s.getRangeAt(0);

    if (
      !s ||
      !s.focusNode ||
      !s.anchorNode ||
      !this.pdfViewer.viewerElement?.contains(s.anchorNode) ||
      !this.pdfViewer.viewerElement.contains(s.focusNode) ||
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
    return this.uiState.get('color');
  }

  public setColor(color: string) {
    this.uiState.set('color', color);
  }

  @action
  public openCommentEditor() {
    const position = this.current?.position;
    assert(position);

    const pageRange = range(position.startPage, position.endPage + 1);
    const currentRanges = pageRange.map((page) => AnnotationManager.positionToRange(position, page));

    const markers = pageRange.map((range) => {
      const textLayer = this.pdfViewer.getPageTextLayerElement(range);

      assert(textLayer);
      return new Mark(textLayer);
    });

    for (const [marker, range] of zip(markers, currentRanges)) {
      marker!.markRanges([range!], {
        className: `text-transparent opacity-40 ${Selection.TEMP_MARK_CLASS_NAME}`,
        each: (el) => {
          (el as HTMLElement).style.backgroundColor = this.color;
        },
      });
    }

    this._isTooltipVisible = false;
    this.commentEditor = {
      content: this.commentEditor?.content || '',
      markers,
    };
  }

  @action
  public closeCommentEditor(clearSelection?: boolean) {
    assert(this.commentEditor?.markers && this.current?.position);
    this.commentEditor.markers.forEach((marker) => marker.unmark({ className: Selection.TEMP_MARK_CLASS_NAME }));

    if (!clearSelection) {
      const currentRange = this.positionToRange(this.current.position);
      this._isTooltipVisible = true;

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
      body: this.commentEditor?.content,
      selector: {
        type: 'PDFTextPositionSelector',
        fullText: this.current.text,
        position: omit(this.current.position, ['toStart']),
        color: this.color,
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

    this.current.stopAutoUpdate?.();
    this.current.stopAutoUpdate = undefined;

    this.current.referenceElement?.remove();
    this.current.referenceElement = undefined;

    this.show.cancel();

    this._isTooltipVisible = false;
    this.current = undefined;

    if (removeSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private readonly show = debounce(
    action(() => {
      if (this.current) {
        this.current.stopAutoUpdate?.();
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
        ...this.generateReferenceElement(range, toStart),
      };

      this._isTooltipVisible = true;
    }),
    300,
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

  private positionToRange(position: Position) {
    const range = new Range();
    const setBoundary = (page: number, totalOffset: number, isStart?: boolean) => {
      const textLayer = this.pdfViewer.getPageTextLayerElement(page);
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

  private static readonly TEMP_MARK_CLASS_NAME = 'temp-comment-editor-mark';
}
