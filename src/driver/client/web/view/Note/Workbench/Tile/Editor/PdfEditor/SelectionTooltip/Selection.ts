import { z } from 'zod';
import {
  generateFragmentFromRange,
  type GenerateFragmentResult,
} from '#third-party/text-fragments-polyfill/fragment-generation-utils';
import { action, observable } from 'mobx';

import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';
import { IS_DEV } from '#domain/shared/infra/env';
import type PdfViewer from '../PDFViewer';
import assert from 'assert';

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  public current: { range: Range; focusNode: Node } | undefined;

  private readonly uiState = new PersistedObject('pdf-selection', z.object({ color: z.string() }), { color: 'yellow' });

  @observable public accessor commentEditor: {
    isVisible: boolean;
    content: string;
    generateResult?: GenerateFragmentResult;
  } = {
    isVisible: false,
    content: '',
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
    this.commentEditor.isVisible = value;

    if (toggleVisibility) {
      this.setVisibility(!this.commentEditor.isVisible);
    }

    if (this.commentEditor.isVisible) {
      // 需要提前生成一下。因为之后视图层会被 mark 标签搞乱，到时候再生成，生成的就不准了
      this.commentEditor.generateResult = this.generateFragment();
    } else {
      this.commentEditor.content = '';
      this.commentEditor.generateResult = undefined;
    }
  }

  @action
  public setCommentContent(value: string) {
    this.commentEditor.content = value;
  }

  @action
  public setVisibility(value: boolean) {
    this.isVisible = value;
  }

  private generateFragment() {
    assert(this.current && this.pdfViewer.viewerElement);

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

    const result = this.commentEditor.isVisible ? this.commentEditor.generateResult : this.generateFragment();

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
      body: this.commentEditor.content,
      selector: {
        type: 'PDFTextFragmentSelector',
        ...result.fragment,
        fullText: this.current.range.toString(),
        startPage: findPage(this.current.range.startContainer),
        endPage: findPage(this.current.range.endContainer),
      },
    });

    this.setCommentVisibility(false);
    this.setVisibility(false);
    this.pdfViewer.renderAnnotation(findPage(this.current.focusNode));
  }
}
