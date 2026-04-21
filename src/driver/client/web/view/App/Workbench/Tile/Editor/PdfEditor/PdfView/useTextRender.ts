import { createEffect } from 'solid-js';
import assert from 'assert';

import { useContext } from '../context';

export default function useTextRender() {
  createEffect(() => {
    const {
      viewer: { viewer, editor },
    } = useContext()!;

    const pages = viewer.visiblePages.map((page) => ({
      page,
      text: editor.texts.loadPageText(page),
    }));

    for (const { page, text } of pages) {
      const { width: pageWidth, height: pageHeight, textLayer } = viewer.getPageInfo(page);

      if (!textLayer || textLayer.dataset.textFetched || !text.data) {
        continue;
      }

      const lineDoms: HTMLElement[] = [];

      for (const { paragraphs } of text.data.blocks || []) {
        for (const { lines } of paragraphs) {
          for (const { bbox, text, confidence } of lines) {
            if (confidence < 40) {
              continue;
            }

            const lineDom = document.createElement('span');

            lineDom.innerText = text.trim();
            lineDom.style.left = `${(bbox.x0 / pageWidth) * 100}%`;
            lineDom.style.top = `${(bbox.y0 / pageHeight) * 100}%`;
            lineDom.style.height = `${((bbox.y1 - bbox.y0) / pageHeight) * 100}%`;
            lineDom.style.width = `${((bbox.x1 - bbox.x0) / pageWidth) * 100}%`;
            lineDom.style.textAlignLast = 'justify';

            lineDoms.push(lineDom);
          }
        }
      }

      const endOfContent = textLayer.querySelector('.endOfContent');
      assert(endOfContent);

      for (const lineEl of lineDoms) {
        textLayer.insertBefore(lineEl, endOfContent);
      }

      textLayer.dataset.textFetched = 'true';
    }
  });
}
