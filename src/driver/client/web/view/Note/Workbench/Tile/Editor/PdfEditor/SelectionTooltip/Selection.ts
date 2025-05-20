import { z } from 'zod';
import {
  generateFragmentFromRange,
  type GenerateFragmentResult,
} from '#third-party/text-fragments-polyfill/fragment-generation-utils';
import { markRange, removeMarks } from '#third-party/text-fragments-polyfill/text-fragment-utils';
import { action, autorun, observable } from 'mobx';
import assert from 'assert';
import { debounce } from 'lodash-es';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';

import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';
import { IS_DEV } from '#domain/shared/infra/env';
import type PdfViewer from '../PDFViewer';

type ValidSelection = ReturnType<typeof window.getSelection> & { focusNode: Node };

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  private rootEl?: HTMLElement;

  @observable.ref private accessor floating:
    | {
        range: Range;
        focusNode: Node;
        placement: 'top' | 'bottom';
        toStart: boolean;
        referenceElement?: HTMLElement;
        dispose?: () => void;
      }
    | undefined;

  @observable.shallow public accessor commentEditor:
    | {
        content: string;
        generateResult: GenerateFragmentResult;
        marks?: Element[];
      }
    | undefined;

  private readonly uiState = new PersistedObject('pdf-selection', z.object({ color: z.string() }), { color: 'yellow' });

  private stopSelecting?: () => void;

  public init(rootEl: HTMLElement) {
    document.addEventListener('selectionchange', this.handleSelection);
    this.stopSelecting = autorun(this.select.bind(this));
    this.rootEl = rootEl;
  }

  private select() {
    if (!this.floating?.range) {
      return;
    }

    // 选中文字后，调起评论编辑框，则 mark 刚才选中的东西
    if (this.commentEditor) {
      const marks = markRange(this.floating.range.cloneRange());

      for (const mark of marks) {
        (mark as HTMLElement).style.backgroundColor = this.color;
        (mark as HTMLElement).style.backgroundColor = this.color;
        (mark as HTMLElement).style.color = 'transparent';
        (mark as HTMLElement).style.opacity = '0.4';
      }

      this.commentEditor.marks = marks;
    }

    // 当前选区工具栏可见但又没选区，则选一下
    if (this.isVisible && !this.getValidSelection()) {
      const s = window.getSelection();

      if (s) {
        s.removeAllRanges();
        s.addRange(this.floating.range);
      }
    }
  }

  private readonly handleSelection = () => {
    if (this.commentEditor) {
      return;
    }

    const s = this.getValidSelection();

    if (s) {
      this.show(s);
    } else {
      this.hide();
    }
  };

  @observable public accessor isVisible = false;

  public get color() {
    return this.uiState.get('color');
  }

  public setColor(color: string) {
    this.uiState.set('color', color);
  }

  @action
  public initCommentEditor() {
    this.isVisible = false;
    this.commentEditor = {
      content: '',
      generateResult: this.generateFragment(), // 需要提前生成一下。因为之后视图层会被 mark 标签搞乱，到时候再生成，生成的就不准了
    };
  }

  @action
  public closeCommentEditor(keep?: boolean) {
    if (this.commentEditor?.marks) {
      removeMarks(this.commentEditor.marks);
    }

    if (!keep) {
      this.commentEditor = undefined;
      this.isVisible = true;
    }
  }

  @action
  public setCommentContent(value: string) {
    assert(this.commentEditor);
    this.commentEditor.content = value;
  }

  private generateFragment() {
    assert(this.floating && this.pdfViewer.viewerElement);

    return generateFragmentFromRange(
      this.floating.range,
      IS_DEV ? new Date(8640000000000000) : undefined,
      this.pdfViewer.viewerElement,
    );
  }

  public async highlight() {
    if (!this.floating) {
      return;
    }

    const result = this.commentEditor ? this.commentEditor.generateResult : this.generateFragment();

    if (!result?.fragment) {
      // todo: add toast
      return;
    }

    const findPage = (node: Node) => {
      let element = node.parentElement;
      let page: number | undefined;

      while (element) {
        if (element.dataset.pageNumber) {
          page = Number(element.dataset.pageNumber);
          break;
        }
        element = element.parentElement;
      }

      if (!page) {
        throw new Error('can not get page');
      }

      return page;
    };

    await this.pdfViewer.editor.annotation.create({
      color: this.uiState.get('color'),
      body: this.commentEditor?.content,
      selector: {
        type: 'PDFTextFragmentSelector',
        ...result.fragment,
        fullText: this.floating.range.toString(),
        startPage: findPage(this.floating.range.startContainer),
        endPage: findPage(this.floating.range.endContainer),
      },
    });

    this.closeCommentEditor();
    this.hide(true);
  }

  private getValidSelection() {
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
      return null;
    }

    return s as ValidSelection;
  }

  private disposeFloating() {
    if (!this.floating) {
      return;
    }

    this.floating.dispose?.();
    this.floating.dispose = undefined;

    this.floating.referenceElement?.remove();
    this.floating.referenceElement = undefined;
  }

  @action
  private hide(removeRange?: boolean) {
    this.disposeFloating();
    this.show.cancel();
    this.isVisible = false;
    this.floating = undefined;

    if (removeRange) {
      window.getSelection()?.removeAllRanges();
    }
  }

  private readonly show = debounce(
    action((s?: ValidSelection) => {
      if (s && s.focusNode && s.anchorNode) {
        let toStart: boolean;
        let placement: 'top' | 'bottom' = 'top';

        if (s.anchorNode === s.focusNode) {
          toStart = s.anchorOffset > s.focusOffset;
          placement = toStart ? 'top' : 'bottom';
        } else {
          toStart = Boolean(s.focusNode.compareDocumentPosition(s.anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING);
          placement = toStart ? 'top' : 'bottom';
        }

        this.floating = {
          range: s.getRangeAt(0),
          focusNode: s.focusNode,
          placement,
          toStart,
          referenceElement: document.createElement('span'),
        };
      }

      if (!this.floating) {
        return;
      }

      assert(this.rootEl, 'no rootEl');
      this.floating.referenceElement = document.createElement('span');
      this.floating.referenceElement.style.height = '1em';

      if (IS_DEV) {
        this.floating.referenceElement.style.backgroundColor = 'black';
      }

      const range = this.floating.range.cloneRange();

      range.collapse(this.floating.toStart);
      range.insertNode(this.floating.referenceElement);

      this.isVisible = true;
      this.floating.dispose = autoUpdate(this.floating.referenceElement, this.rootEl, () => {
        if (!this.floating?.referenceElement) {
          return;
        }

        computePosition(this.floating.referenceElement, this.rootEl!, {
          placement: this.floating!.placement,
          middleware: [flip(), offset(5)],
        }).then(({ x, y }) => {
          Object.assign(this.rootEl!.style, { left: `${x}px`, top: `${y}px` });
        });
      });
    }),
    500,
  );

  public dispose() {
    this.stopSelecting?.();
    this.disposeFloating();
    this.show.cancel();
    this.closeCommentEditor(true);
    document.removeEventListener('selectionchange', this.handleSelection);
  }
}
