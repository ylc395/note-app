import { getPageData, helper } from 'single-file-core/single-file';

import type { MaterialDTO } from 'interface/material';
import AreaSelector from './AreaSelector';

const areaSelector = new AreaSelector({
  onSelect: async (el) => {
    areaSelector.destroy();

    Array.from(el.querySelectorAll('*')).forEach((child) => {
      child.setAttribute(helper.SELECTED_CONTENT_ATTRIBUTE_NAME, '');
    });
    let _el: null | HTMLElement = el;
    while (_el) {
      _el.setAttribute(helper.SELECTED_CONTENT_ATTRIBUTE_NAME, '');
      _el = _el.parentElement;
    }

    const res = await getPageData({
      blockScripts: true,
      selected: true,
      removeUnusedFonts: true,
      removeUnusedStyles: true,
      removeHiddenElements: true,
      removeDiscardedResources: true,
      compressHTML: true,
    });

    fetch('http://localhost:3001/materials', {
      method: 'POST',
      headers: {
        authorization: '47929996-9af9-4786-8589-3e57fc6119c6',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        parentId: 'b71a9626df5d47829005a7ac4acde150',
        file: { mimeType: 'text/html', data: res.content },
        name: res.title,
      } satisfies MaterialDTO),
    });
  },
});
