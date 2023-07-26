import { getPageData, helper } from 'single-file-core/single-file';
import Turndown from 'turndown';
import { Readability } from '@mozilla/readability';
import { action, makeObservable, observable } from 'mobx';

import EventBus from 'infra/EventBus';
import { getRemoteApi } from 'infra/remoteApi';
import type WebPageService from 'service/WebPageService';
import type { Rect } from 'components/RectAreaSelector';
import { type Task, type TaskResult, EventNames, TaskTypes } from 'model/task';

// single-file lib will modify the options. so use a option factory to always get a new option object
const getCommonPageOptions = () => ({
  blockScripts: true,
  removeUnusedFonts: true,
  removeUnusedStyles: true,
  removeHiddenElements: true,
  removeDiscardedResources: true,
  compressHTML: true,
  saveFavicon: true,
  saveOriginalURLs: true,
});

const turndownService = new Turndown();
const remoteApi = getRemoteApi<typeof WebPageService>();

type Mode = 'element-select' | 'screen-capture';

export default class ClipService {
  activeTask?: Task;
  @observable activeTaskResult?: TaskResult;
  @observable mode?: Mode;
  private readonly eventBus = new EventBus();

  constructor() {
    this.eventBus.on(EventNames.StartTask, ({ task }) => this.startTask(task));
    this.eventBus.on(EventNames.CancelTask, ({ error }) => error && this.cancelByError(error));
    this.eventBus.on(EventNames.FinishTask, this.reset.bind(this));
    window.addEventListener('pagehide', this.cancelByUser.bind(this));
    makeObservable(this);
  }

  private readonly clipWholePage = async () => {
    const res = await getPageData(getCommonPageOptions());

    this.preview({
      title: res.title,
      content: res.content,
      contentType: 'html',
    });
  };

  async clipElement(el: HTMLElement) {
    if (!this.activeTask) {
      throw new Error('no activeTask');
    }

    if (this.activeTask.type === TaskTypes.SelectElementText) {
      this.preview({ ...ClipService.getMarkdown(el), contentType: 'md' });
    } else {
      const res = await ClipService.getHtml(el);
      this.preview({ ...res, contentType: 'html' });
    }
  }

  async captureScreen(pos: Rect) {
    const imgDataUrl = await remoteApi.captureScreen();
    const imgEl = new Image();
    const canvasEl = document.createElement('canvas');
    canvasEl.width = pos.width * window.devicePixelRatio;
    canvasEl.height = pos.height * window.devicePixelRatio;
    imgEl.src = imgDataUrl;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvasEl.getContext('2d')!;

    imgEl.addEventListener('load', () => {
      ctx.drawImage(
        imgEl,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (typeof pos.left === 'number' ? pos.left : pos.right! - pos.width) * window.devicePixelRatio,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (typeof pos.top === 'number' ? pos.top : pos.bottom! - pos.height) * window.devicePixelRatio,
        pos.width * window.devicePixelRatio,
        pos.height * window.devicePixelRatio,
        0,
        0,
        canvasEl.width,
        canvasEl.height,
      );
      const clippedDataUrl = canvasEl.toDataURL();
      this.submit({ title: `Screenshot - ${document.title}`, content: clippedDataUrl, contentType: 'png' });
    });
  }

  private extractMainText() {
    const readability = new Readability(document.cloneNode(true) as Document);
    const result = readability.parse();

    if (!result) {
      this.cancelByError('can not extract main text');
      return;
    }

    this.submit({ title: result.title, content: turndownService.turndown(result.content), contentType: 'md' });
  }

  private static getMarkdown(el: HTMLElement) {
    return { title: document.title, content: turndownService.turndown(el) };
  }

  private static async getHtml(el: HTMLElement) {
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

    const { content, title } = await getPageData({
      selected: true,
      ...getCommonPageOptions(),
    });

    for (const el of markedEls) {
      el.removeAttribute(helper.SELECTED_CONTENT_ATTRIBUTE_NAME);
    }

    return { content, title };
  }

  private async startTask(task: Task) {
    if (this.activeTask) {
      throw new Error('can not clip now');
    }

    this.activeTask = task;

    switch (task.type) {
      case TaskTypes.SelectElement:
      case TaskTypes.SelectElementText:
        return this.setMode('element-select');
      case TaskTypes.ScreenShot:
        return this.setMode('screen-capture');
      case TaskTypes.SelectPage:
        return this.clipWholePage();
      case TaskTypes.ExtractText:
        return this.extractMainText();
      default:
        return;
    }
  }

  cancelByUser() {
    if (!this.activeTask) {
      return;
    }

    this.eventBus.emit(EventNames.CancelTask, { taskId: this.activeTask.id });
    this.reset();
  }

  private cancelByError(error: string) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if ([TaskTypes.SelectElement, TaskTypes.SelectElementText, TaskTypes.ScreenShot].includes(this.activeTask!.type)) {
      window.alert(error);
    }

    this.reset();
  }

  submit(result: TaskResult) {
    if (!this.activeTask) {
      throw new Error('no activeTask');
    }

    this.eventBus.emit(EventNames.Submit, { taskId: this.activeTask.id, ...result });
  }

  @action
  private preview(result: TaskResult) {
    this.mode = undefined;
    this.activeTaskResult = result;
  }

  @action
  private reset() {
    this.mode = undefined;
    this.activeTask = undefined;
    this.activeTaskResult = undefined;
  }

  @action
  private setMode(mode: Mode) {
    this.mode = mode;
  }

  static processHtmlForPreview(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    for (const el of doc.querySelectorAll('*')) {
      for (const { name, value } of (el as HTMLElement).attributes) {
        if (name.startsWith('data-sf-original-')) {
          const attr = name.replace('data-sf-original-', '');
          el.setAttribute(attr, value);
        }
      }
    }

    const result = doc.documentElement.outerHTML.replaceAll(/\/\* original URL: (.+?) \*\/url\((.+?)\)/g, 'url($1)');
    return result;
  }
}
