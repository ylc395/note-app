import { getPageData, helper } from 'single-file-core/single-file';
import ElementSelector from '../../../client/driver/web/views/Workbench/Editor/common/ElementSelector';
import { Actions } from 'interface/payload';

export default class ClipService {
  private readonly clipElement = async (el: HTMLElement) => {
    this.elementSelector.disable();

    /** mark selected element and its descendants */
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
      saveFavicon: true,
    });

    this.generatePreview('html', res.content);
  };

  private readonly elementSelector = new ElementSelector({
    selectableRoot: document.body,
    onSelect: this.clipElement,
  });

  handleAction(action: Actions) {
    switch (action) {
      case Actions.SelectElement:
        return this.elementSelector.enable();
      default:
        return;
    }
  }

  private generatePreview(type: 'md' | 'html', content: string) {
    console.log(content);
  }
}
