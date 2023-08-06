import { getPageData, helper } from 'single-file-core/single-file';
import Turndown from 'turndown';
import { Readability } from '@mozilla/readability';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { container, singleton } from 'tsyringe';
import pageLifecycle from 'page-lifecycle';

import EventBus from 'infra/EventBus';
import { token as pageFactoryToken } from 'infra/page';

import type NoteTree from 'model/NoteTree';
import { type Task, type TaskResult, EventNames, TaskTypes } from 'model/task';
import type MaterialTree from 'model/MaterialTree';
import type { Rect } from 'components/RectAreaSelector';

import ConfigService from './ConfigService';

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

@singleton()
export default class ClipService {
  @observable activeTask?: Task;
  @observable activeTaskResult?: TaskResult;
  @observable isLoading = false;
  readonly eventBus = container.resolve(EventBus);
  @observable.ref targetTree?: NoteTree | MaterialTree;
  readonly config = container.resolve(ConfigService);

  constructor() {
    this.eventBus.on(EventNames.StartTask, ({ task }) => this.startTask(task));
    this.eventBus.on(EventNames.CancelTask, ({ error }) => error && this.cancelByError(error));
    this.eventBus.on(EventNames.FinishTask, this.reset.bind(this));
    pageLifecycle.addEventListener('statechange', ({ newState }: { newState: string }) => {
      if (newState === 'terminated') {
        this.cancelByUser();
      }
    });
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

    runInAction(() => (this.isLoading = true));

    if (this.activeTask.type === TaskTypes.SelectElementText) {
      this.preview({ ...ClipService.getMarkdown(el), contentType: 'md' });
    } else {
      const res = await ClipService.getHtml(el);
      this.preview({ ...res, contentType: 'html' });
    }
  }

  async captureScreen(pos: Rect) {
    const page = container.resolve(pageFactoryToken)();
    const imgDataUrl = await page.captureScreen();
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

      this.preview({
        title: `Screenshot - ${document.title}`,
        content: clippedDataUrl,
        contentType: 'png',
      });
    });
  }

  private extractMainText() {
    const readability = new Readability(document.cloneNode(true) as Document);
    const result = readability.parse();

    if (!result) {
      this.cancelByError('can not extract main text');
      return;
    }

    this.preview({ title: result.title, content: turndownService.turndown(result.content), contentType: 'md' });
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

    runInAction(() => {
      this.activeTask = task;
    });

    switch (task.type) {
      case TaskTypes.SelectPage:
        return this.clipWholePage();
      case TaskTypes.ExtractText:
        return this.extractMainText();
      default:
        return;
    }
  }

  readonly cancelByUser = () => {
    if (!this.activeTask) {
      return;
    }

    this.eventBus.emit(EventNames.CancelTask, { taskId: this.activeTask.id });
    this.reset();
  };

  private cancelByError(error: string) {
    if (!this.activeTask) {
      throw new Error('no activeTask');
    }

    if ([TaskTypes.SelectElement, TaskTypes.SelectElementText, TaskTypes.ScreenShot].includes(this.activeTask.type)) {
      window.alert(error);
    }

    this.reset();
  }

  readonly submit = () => {
    if (!this.activeTask || !this.activeTaskResult) {
      throw new Error('no activeTask');
    }

    if (!this.config.isValidTarget) {
      throw new Error('invalid target');
    }

    this.eventBus.emit(EventNames.Submit, { taskId: this.activeTask.id, ...this.activeTaskResult });
  };

  @action
  private preview(result: TaskResult) {
    this.activeTaskResult = result;
    this.isLoading = false;
    this.eventBus.emit(EventNames.Preview, undefined);
  }

  @action
  private reset() {
    this.activeTask = undefined;
    this.activeTaskResult = undefined;
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
