import { z } from 'zod';
import {
  generateFragmentFromRange,
  type GenerateFragmentResult,
} from '#third-party/text-fragments-polyfill/fragment-generation-utils';
import {
  markRange,
  processFragmentDirectives,
  removeMarks,
} from '#third-party/text-fragments-polyfill/text-fragment-utils';
import { action, observable } from 'mobx';
import assert from 'assert';
import { debounce, last } from 'lodash-es';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';

import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';
import { IS_DEV } from '#domain/shared/infra/env';
import type PdfViewer from '../PDFViewer';

interface CommentEditor {
  content: string;
  generateResult: GenerateFragmentResult;
  marks: Element[];
}

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  private rootEl?: HTMLElement;

  @observable public accessor isVisible = false;

  private current?: {
    range?: Range;
    originRange?: { startNode: Node; endNode: Node; startOffset: number; endOffset: number };
    referenceElement?: HTMLElement;
    toStart: boolean;
    dispose?: () => void;
  };

  private getCurrentRange() {
    if (!this.current?.originRange?.startNode.firstChild || !this.current.originRange.endNode.lastChild) {
      return null;
    }

    const range = new Range();
    const setBoundary = (node: Node, totalOffset: number, isStart?: boolean) => {
      let offset = 0;

      for (const child of node.childNodes) {
        // childNodes 中可能包含 referenceElement，需要通过 for 循环来跳过之
        if (!(child instanceof Text)) {
          continue;
        }

        if (child.length + offset >= totalOffset) {
          range[isStart ? 'setStart' : 'setEnd'](child, totalOffset - offset);
          return true;
        } else {
          offset += child.length;
        }
      }
      return false;
    };

    if (
      setBoundary(this.current.originRange.startNode, this.current.originRange.startOffset, true) &&
      setBoundary(this.current.originRange.endNode, this.current.originRange.endOffset)
    ) {
      return range;
    }

    return null;
  }

  @observable.ref public accessor commentEditor: CommentEditor | undefined;

  private readonly uiState = new PersistedObject('pdf-selection', z.object({ color: z.string() }), { color: 'yellow' });

  public activate(rootEl: HTMLElement) {
    this.rootEl = rootEl;
    this.restoreCommentEditor();

    document.addEventListener('selectionchange', this.handleSelection.bind(this));
  }

  public deactivate() {
    if (this.current) {
      this.current.dispose?.();
      this.current.dispose = undefined;
      this.current.referenceElement = undefined;
      this.current.originRange = undefined;
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
    const currentRange = this.getCurrentRange();
    assert(currentRange);

    const marks = markRange(currentRange);

    for (const mark of marks) {
      (mark as HTMLElement).style.backgroundColor = this.color;
      (mark as HTMLElement).style.color = 'transparent';
      (mark as HTMLElement).style.opacity = '0.4';
    }

    this.isVisible = false;
    this.commentEditor = {
      content: '',
      generateResult: this.generateFragment(),
      marks,
    };
  }

  private restoreCommentEditor() {
    if (!this.current || !this.commentEditor || !this.commentEditor.generateResult.fragment) {
      return;
    }

    const marks = processFragmentDirectives({ text: this.commentEditor.generateResult.fragment }).text[0];
    const firstMark = marks?.[0];
    const lastMark = last(marks);

    if (!firstMark || !lastMark) {
      return;
    }

    const range = new Range(); // Range 对象是活的。当 DOM 变化时（例如 mark 元素被移除）它总是能映射到最新的 DOM 上
    range.setStartAfter(firstMark);
    range.setEndBefore(lastMark);

    this.commentEditor.marks = marks;
    this.current = {
      ...this.current,
      ...this.generateReferenceElement(range, this.current.toStart),
    };
  }

  @action
  public closeCommentEditor(clearSelection?: boolean) {
    assert(this.commentEditor);
    removeMarks(this.commentEditor.marks);

    const currentRange = this.getCurrentRange();
    assert(currentRange);

    if (!clearSelection) {
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

  private generateFragment() {
    assert(this.current && this.pdfViewer.viewerElement && this.current.range);

    return generateFragmentFromRange(
      this.current.range,
      IS_DEV ? new Date(8640000000000000) : undefined,
      this.pdfViewer.viewerElement,
    );
  }

  public async highlight() {
    assert(this.current && this.current.originRange);
    const result = this.commentEditor ? this.commentEditor.generateResult : this.generateFragment();

    if (!result?.fragment) {
      // todo: add toast
      return;
    }

    await this.pdfViewer.editor.annotation.create({
      color: this.uiState.get('color'),
      body: this.commentEditor?.content,
      selector: {
        type: 'PDFTextFragmentSelector',
        fullText: this.current.originRange.toString(),
        fragments: [],
        // fragments: Selection.generateTextFragments(this.floating.range),
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

      let toStart = this.current?.toStart;

      if (typeof toStart !== 'boolean') {
        if (s.anchorNode === s.focusNode) {
          toStart = s.anchorOffset > s.focusOffset;
        } else {
          toStart = Boolean(s.focusNode.compareDocumentPosition(s.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING);
        }
      }

      this.current = {
        range,
        originRange: {
          startNode: startNode.parentElement,
          startOffset: range.startOffset,
          endNode: endNode.parentElement,
          endOffset: range.endOffset,
        },
        toStart,
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
}
