import { z } from 'zod';
import {
  generateFragmentFromRange,
  type GenerateFragmentResult,
} from '#third-party/text-fragments-polyfill/fragment-generation-utils';
import { action, observable } from 'mobx';

import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';
import { IS_DEV } from '#domain/shared/infra/env';
import type PdfViewer from '../PDFViewer';

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  public current: { range: Range; focusNode: Node } | undefined;

  private readonly uiState = new PersistedObject('pdf-selection', z.object({ color: z.string() }), { color: 'yellow' });

  @observable public accessor comment = {
    isVisible: false,
    content: '',
    generateResult: undefined as undefined | GenerateFragmentResult,
  };

  @observable public accessor isVisible = false;

  public get color() {
    return this.uiState.get('color');
  }

  public setColor(color: string) {
    this.uiState.set('color', color);
  }

  @action
  public setCommentVisibility(value: boolean, toggleVisibility?: boolean) {
    this.comment.isVisible = value;

    if (toggleVisibility) {
      this.setVisibility(!this.comment.isVisible);
    }

    if (!this.comment.isVisible) {
      this.comment.content = '';
      this.comment.generateResult = undefined;
    } else {
      // 需要提前生成一下。因为之后视图层会被 mark 标签搞乱，到时候再生成，生成的就不准了
      this.comment.generateResult = this.generateFragment();
    }
  }

  @action
  public setComment(value: string) {
    this.comment.content = value;
  }

  @action
  public setVisibility(value: boolean) {
    this.isVisible = value;
  }

  private generateFragment() {
    if (!this.current || !this.pdfViewer.viewerElement) {
      return;
    }

    return generateFragmentFromRange(
      this.current.range,
      IS_DEV ? new Date(8640000000000000) : undefined,
      this.pdfViewer.viewerElement,
    );
  }

  public async highlight() {
    if (!this.current) {
      return;
    }

    const result = this.comment.isVisible ? this.comment.generateResult : this.generateFragment();

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
      body: this.comment.content,
      selector: {
        type: 'PDFTextFragmentSelector',
        ...result.fragment,
        fullText: this.current.range.toString(),
        startPage: findPage(this.current.range.startContainer),
        endPage: findPage(this.current.range.endContainer),
      },
    });

    this.setCommentVisibility(false);
    this.isVisible = false;
    this.pdfViewer.renderAnnotation(findPage(this.current.focusNode));
  }
}
