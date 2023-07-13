import { getPageData, helper } from 'single-file-core/single-file';
import browser from 'webextension-polyfill';

import ElementSelector from 'web/views/Workbench/Editor/common/ElementSelector';
import { TaskTypes } from 'domain/model/Task';
import { type CancelTaskRequest, type SubmitRequest, type StartTaskRequest, RequestTypes } from 'domain/model/Request';

const COMMON_GET_PAGE_OPTIONS = {
  blockScripts: true,
  removeUnusedFonts: true,
  removeUnusedStyles: true,
  removeHiddenElements: true,
  removeDiscardedResources: true,
  compressHTML: true,
  saveFavicon: true,
};

export default class ClipService {
  private activeAction?: TaskTypes;

  constructor() {
    browser.runtime.onMessage.addListener((message: StartTaskRequest | CancelTaskRequest) => {
      switch (message.type) {
        case RequestTypes.StartTask:
          return this.handleAction(message.action);
        case RequestTypes.CancelTask:
          return message.error ? this.alert(message.error) : undefined;
        default:
          break;
      }
    });
    window.addEventListener('pagehide', this.cancel.bind(this));
  }

  private readonly clipWholePage = async () => {
    const res = await getPageData(COMMON_GET_PAGE_OPTIONS);

    this.submit({
      title: res.title,
      content: res.content,
      type: 'html',
    });
  };

  private readonly clipElement = async (el: HTMLElement) => {
    this.elementSelector.disable();

    /** mark selected element and its descendants and ancestors */
    const markedEls: HTMLElement[] = [];
    Array.from(el.querySelectorAll('*')).forEach((child) => {
      markedEls.push(child as HTMLElement);
      child.setAttribute(helper.SELECTED_CONTENT_ATTRIBUTE_NAME, '');
    });
    let _el: null | HTMLElement = el;
    while (_el) {
      markedEls.push(_el);
      _el.setAttribute(helper.SELECTED_CONTENT_ATTRIBUTE_NAME, '');
      _el = _el.parentElement;
    }

    const res = await getPageData({
      selected: true,
      ...COMMON_GET_PAGE_OPTIONS,
    });

    for (const el of markedEls) {
      el.removeAttribute(helper.SELECTED_CONTENT_ATTRIBUTE_NAME);
    }

    this.submit({
      title: res.title,
      content: res.content,
      type: 'html',
    });
  };

  private readonly elementSelector = new ElementSelector({
    selectableRoot: document.body,
    onSelect: this.clipElement,
    onCancel: this.cancel.bind(this),
  });

  private async handleAction(action: TaskTypes) {
    if (this.activeAction) {
      throw new Error('can not clip now');
    }

    this.activeAction = action;

    switch (action) {
      case TaskTypes.SelectElement:
        return this.elementSelector.enable();
      case TaskTypes.SelectPage:
        return this.clipWholePage();
      default:
        return;
    }
  }

  cancel() {
    if (this.activeAction) {
      browser.runtime.sendMessage({ type: RequestTypes.CancelTask } satisfies CancelTaskRequest);
      this.activeAction = undefined;
    }
  }

  private submit(result: SubmitRequest['payload']) {
    if (this.activeAction) {
      this.activeAction = undefined;
      browser.runtime.sendMessage({ type: RequestTypes.Submit, payload: result } satisfies SubmitRequest);
    }
  }

  private alert(msg: string) {
    window.alert(msg);
  }
}
