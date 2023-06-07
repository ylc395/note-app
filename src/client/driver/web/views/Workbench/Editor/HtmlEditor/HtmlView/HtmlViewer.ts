import { when, computed, makeObservable, observable, action } from 'mobx';
import DOMPurify from 'dompurify';
import getCssSelector from 'css-selector-generator';
import { toPng } from 'html-to-image';

import { ui } from 'web/infra/ui';
import { AnnotationTypes } from 'interface/material';
import type HtmlEditor from 'model/material/HtmlEditor';

import RangeSelector, { type RangeSelectEvent } from '../../common/RangeSelector';
import ElementSelector from '../../common/ElementSelector';

interface Options {
  editor: HtmlEditor;
  rootEl: HTMLElement;
  editorRootEl: HTMLElement;
}

export default class HtmlViewer {
  readonly rootEl: ShadowRoot;
  private stopLoadingHtml?: ReturnType<typeof when>;
  readonly elementSelector: ElementSelector;
  private readonly rangeSelector: RangeSelector;

  @observable.ref
  selection: RangeSelectEvent | null = null;

  get editor() {
    return this.options.editor;
  }

  @computed
  get title() {
    let text = this.editor.entity?.metadata.sourceUrl || '未命名 HTML 文档';
    let icon = this.editor.entity?.metadata.icon || '';

    if (this.editor.documentElement instanceof HTMLHtmlElement) {
      const titleContent = this.editor.documentElement.querySelector('title')?.innerText;

      if (titleContent) {
        text = titleContent;
      }

      const iconContent = this.editor.documentElement.querySelector('link[rel="icon"]')?.getAttribute('href');

      if (iconContent) {
        icon = iconContent;
      }
    }

    return { text, icon };
  }

  constructor(protected readonly options: Options) {
    makeObservable(this);

    this.rootEl = options.rootEl.shadowRoot || options.rootEl.attachShadow({ mode: 'open' });
    this.rootEl.addEventListener('click', this.hijackClick);

    this.elementSelector = new ElementSelector({
      selectableRoot: this.rootEl,
      onSelect: this.handleElementSelect,
      cancelableRoot: options.editorRootEl,
    });

    this.rangeSelector = new RangeSelector({
      rootEl: this.rootEl,
      onTextSelectionChanged: action((e) => (this.selection = e)),
    });
    this.initContent();
  }

  private readonly handleElementSelect = async (e: HTMLElement) => {
    const result = await this.createElementAnnotation(e, 'yellow');

    if (result) {
      this.elementSelector.disable();
    } else {
      ui.feedback({ type: 'fail', content: '该位置已有标记' });
    }
  };

  private readonly hijackClick = (e: Event) => {
    if (this.elementSelector.isEnabled) {
      e.preventDefault();
      return;
    }

    for (const el of e.composedPath() as HTMLElement[]) {
      if (el.tagName === 'A') {
        const href = el.getAttribute('href');

        if (href) {
          ui.openNewWindow(href);
        }

        e.preventDefault();
        return;
      }

      if (el.tagName === 'BUTTON' && el.getAttribute('type') === 'submit') {
        e.preventDefault();
        return;
      }
    }
  };

  destroy(): void {
    this.rootEl.removeEventListener('click', this.hijackClick);
    this.elementSelector.disable();
    this.rangeSelector.destroy();
    this.stopLoadingHtml?.();
  }

  private initContent() {
    if (this.editor.documentElement instanceof HTMLHtmlElement) {
      this.rootEl.replaceChildren(this.editor.documentElement);
    } else {
      this.stopLoadingHtml = when(
        () => Boolean(this.editor.entity),
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const documentElement = HtmlViewer.filterHtml(this.editor.entity!.html);
          HtmlViewer.processStyles(documentElement);
          this.editor.documentElement = documentElement;
          this.rootEl.replaceChildren(documentElement);
        },
      );
    }
  }

  private static processStyles(root: HTMLHtmlElement) {
    const styles = root.querySelectorAll('style');

    for (const style of styles) {
      if (!style.sheet) {
        continue;
      }

      const selectors = new Set<string>();

      for (const rule of style.sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          if (rule.selectorText.includes(':root')) {
            selectors.add(rule.selectorText);
          }
        }
      }

      // maybe we should use css parser to do this
      for (const selector of selectors) {
        style.innerHTML = style.innerHTML.replaceAll(selector, selector.replaceAll(':root', 'html'));
      }
    }
  }

  private static filterHtml(html: string) {
    const fragment = DOMPurify.sanitize(html, {
      FORBID_CONTENTS: ['script'], // override default forbid contents. Only <script> is dangerous for us
      ADD_TAGS: ['style'],
      FORBID_ATTR: ['action'],
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: () => true,
        attributeNameCheck: () => true,
        allowCustomizedBuiltInElements: true,
      },
      WHOLE_DOCUMENT: true, // wrap content with <html> or preserve original <html>
      RETURN_DOM: true,
    });

    return fragment as HTMLHtmlElement;
  }

  private async createElementAnnotation(el: HTMLElement, color: string) {
    const uniqueSelector = getCssSelector(el, { root: this.rootEl });
    const existed = this.editor.annotations.find(
      (annotation) => annotation.type === AnnotationTypes.HtmlElement && annotation.selector === uniqueSelector,
    );

    if (existed) {
      return false;
    }

    await this.options.editor.createAnnotation({
      type: AnnotationTypes.HtmlElement,
      color,
      selector: uniqueSelector,
      snapshot: await toPng(el),
    });

    return true;
  }

  createRangeAnnotation(color: string) {
    if (!this.selection) {
      throw new Error('no selection');
    }

    const { range } = this.selection;

    this.editor.createAnnotation({
      type: AnnotationTypes.HtmlRange,
      color,
      range: [
        { selector: getCssSelector(range.startContainer, { root: this.rootEl }), offset: range.startOffset },
        { selector: getCssSelector(range.endContainer, { root: this.rootEl }), offset: range.endOffset },
      ],
    });
  }
}
