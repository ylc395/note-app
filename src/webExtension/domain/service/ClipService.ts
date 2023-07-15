import { getPageData, helper } from 'single-file-core/single-file';

import ElementSelector from 'web/views/Workbench/Editor/common/ElementSelector';
import { type Task, EventNames, TaskTypes, CancelEvent } from 'domain/model/task';
import EventBus from 'domain/infra/EventBus';

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
  private activeTask?: Task;
  private readonly eventBus = new EventBus();

  constructor() {
    this.eventBus.on(EventNames.StartTask, ({ task }) => this.startTask(task));
    this.eventBus.on(EventNames.CancelTask, this.cancelByError.bind(this));
    this.eventBus.on(EventNames.FinishTask, this.reset.bind(this));
    window.addEventListener('pagehide', this.cancelByUser.bind(this));
  }

  private readonly clipWholePage = async () => {
    const res = await getPageData(COMMON_GET_PAGE_OPTIONS);

    this.submit({
      title: res.title,
      content: res.content,
      contentType: 'html',
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
      contentType: 'html',
    });
  };

  private readonly elementSelector = new ElementSelector({
    selectableRoot: document.body,
    onSelect: this.clipElement,
    onCancel: this.cancelByUser.bind(this),
  });

  private async startTask(task: Task) {
    if (this.activeTask) {
      throw new Error('can not clip now');
    }

    this.activeTask = task;

    switch (task.type) {
      case TaskTypes.SelectElement:
        return this.elementSelector.enable();
      case TaskTypes.SelectPage:
        return this.clipWholePage();
      default:
        return;
    }
  }

  private cancelByUser() {
    if (!this.activeTask) {
      return;
    }

    this.eventBus.emit(EventNames.CancelTask, { taskId: this.activeTask.id });
    this.reset();
  }

  private cancelByError({ error, taskId }: CancelEvent) {
    if (this.activeTask?.id !== taskId || !error) {
      throw new Error('invalid cancel event');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if ([TaskTypes.SelectElement, TaskTypes.SelectElementText, TaskTypes.ScreenShot].includes(this.activeTask!.type)) {
      window.alert(error);
    }

    this.reset();
  }

  private submit(result: { title: string; content: string; contentType: 'md' | 'html' }) {
    if (!this.activeTask) {
      throw new Error('no activeTask');
    }

    this.eventBus.emit(EventNames.Submit, { taskId: this.activeTask.id, ...result });
  }

  private reset() {
    this.activeTask = undefined;
  }

  static hasSelection() {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed);
  }
}
