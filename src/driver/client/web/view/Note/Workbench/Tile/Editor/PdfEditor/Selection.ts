import { generateFragmentFromRange } from 'text-fragments-polyfill/dist/fragment-generation-utils.js';
import { z } from 'zod';

import type PdfViewer from './PDFViewer';
import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';

export default class Selection {
  constructor(private readonly pdfViewer: PdfViewer) {}

  public readonly uiState = new PersistedObject('pdf-selection', z.object({ color: z.string() }), { color: 'yellow' });

  public async highlight() {
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (!range || !selection?.focusNode) {
      return;
    }

    const { fragment } = generateFragmentFromRange(range);

    if (!fragment) {
      throw new Error('can not generate fragment');
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
      selector: {
        type: 'PDFTextFragmentSelector',
        ...fragment,
        fullText: range.toString(),
        startPage: findPage(range.startContainer),
        endPage: findPage(range.endContainer),
      },
    });

    this.pdfViewer.renderAnnotation(findPage(selection.focusNode));
  }
}
