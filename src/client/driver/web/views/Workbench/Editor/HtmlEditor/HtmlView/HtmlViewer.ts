import { when, computed, makeObservable } from 'mobx';
import DOMPurify from 'dompurify';
import getCssSelector from 'css-selector-generator';

import { ui } from 'web/infra/ui';
import { AnnotationTypes } from 'interface/material';
import type HtmlEditor from 'model/material/HtmlEditor';

import RangeSelectable, { Options as CommonOptions } from '../../common/RangeSelectable';
import ElementSelector from './ElementSelector';

interface Options extends CommonOptions {
  editor: HtmlEditor;
  rootEl: HTMLElement;
}

export default class HtmlViewer extends RangeSelectable {
  protected readonly rootEl: ShadowRoot;
  private stopLoadingHtml?: ReturnType<typeof when>;
  readonly elementSelector: ElementSelector;

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
    super(options);
    makeObservable(this);

    this.rootEl = options.rootEl.shadowRoot || options.rootEl.attachShadow({ mode: 'open' });
    this.rootEl.addEventListener('click', HtmlViewer.hijackClick);
    this.elementSelector = new ElementSelector({
      root: this.rootEl,
      onSelect: (el) => this.createHighlightElement(el, 'yellow'),
    });
    this.initContent();
  }

  private static hijackClick(e: Event) {
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
  }

  destroy(): void {
    this.rootEl.removeEventListener('click', HtmlViewer.hijackClick);
    this.stopLoadingHtml?.();
    this.elementSelector.destroy();
    super.destroy();
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

  async createHighlightElement(el: HTMLElement, color: string) {
    const uniqueSelector = getCssSelector(el, { root: this.rootEl });

    await this.options.editor.createAnnotation({
      type: AnnotationTypes.HighlightElement,
      annotation: {
        color,
        selector: uniqueSelector,
      },
    });
  }
}
