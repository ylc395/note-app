import { when, computed, makeObservable, observable, action } from 'mobx';
import DOMPurify from 'dompurify';
import getCssSelector from 'css-selector-generator';

import { ui } from 'web/infra/ui';
import { AnnotationTypes, type AnnotationVO } from 'model/material';
import type HtmlEditor from 'model/material/editor/HtmlEditor';

import RangeSelector, { type RangeSelectEvent } from '../../common/RangeSelector';

interface Options {
  editor: HtmlEditor;
  rootEl: HTMLElement;
  editorRootEl: HTMLElement;
}

export default class HtmlViewer {
  readonly shadowRoot: ShadowRoot;
  private stopLoadingHtml?: ReturnType<typeof when>;
  private readonly rangeSelector: RangeSelector;

  @observable.ref
  selection: RangeSelectEvent | null = null;

  get html() {
    return this.options.editor.editable;
  }

  get editor() {
    return this.options.editor;
  }

  @computed
  get title() {
    let text = this.html.entity?.metadata.sourceUrl || '未命名 HTML 文档';
    let icon = this.html.entity?.metadata.icon || '';

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

    this.shadowRoot = options.rootEl.shadowRoot || options.rootEl.attachShadow({ mode: 'open' });
    this.shadowRoot.addEventListener('click', this.hijackClick);
    options.editorRootEl.addEventListener('scroll', this.updateScrollState);

    this.rangeSelector = new RangeSelector({
      rootEl: this.shadowRoot,
      onTextSelectionChanged: action((e) => (this.selection = e)),
    });
    this.initContent();
  }

  private readonly updateScrollState = action((e: Event) => {
    const { scrollTop } = e.target as HTMLElement;
    this.editor.updateUIState({ scrollTop });
  });

  private getUniqueSelector(el: HTMLElement) {
    return getCssSelector(el, { root: this.shadowRoot }).replace(':root > :nth-child(1)', 'html');
  }

  private readonly hijackClick = (e: Event) => {
    for (const el of e.composedPath() as HTMLElement[]) {
      if (el.tagName === 'A') {
        const href = el.getAttribute('href');

        if (href && !href.startsWith('#')) {
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
    this.shadowRoot.removeEventListener('click', this.hijackClick);
    this.rangeSelector.destroy();
    this.stopLoadingHtml?.();
    this.options.editorRootEl.removeEventListener('scroll', this.updateScrollState);
  }

  private initContent() {
    if (this.editor.documentElement instanceof HTMLHtmlElement) {
      this.updateContent(this.editor.documentElement);
    } else {
      this.stopLoadingHtml = when(
        () => Boolean(this.html.entity),
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const documentElement = HtmlViewer.sanitizeHtml(this.html.entity!.html);
          HtmlViewer.processStyles(documentElement);
          this.editor.documentElement = documentElement;
          this.updateContent(documentElement);
        },
      );
    }
  }

  private updateContent(html: HTMLHtmlElement) {
    this.shadowRoot.replaceChildren(html);
    this.options.editorRootEl.scrollTop = this.editor.uiState.scrollTop;
  }

  private static processStyles(root: HTMLHtmlElement) {
    const styles = root.querySelectorAll('style');

    for (const style of styles) {
      if (!style.sheet) {
        continue;
      }

      const rootSelectors = new Set<string>();

      for (const rule of style.sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          if (rule.selectorText.includes(':root')) {
            rootSelectors.add(rule.selectorText);
          }
        }
      }

      // maybe we should use css parser to do this
      for (const selector of rootSelectors) {
        style.innerHTML = style.innerHTML.replaceAll(selector, selector.replaceAll(':root', 'html'));
      }
    }
  }

  private static sanitizeHtml(html: string) {
    const fragment = DOMPurify.sanitize(html, {
      FORBID_CONTENTS: ['script'], // override default forbid contents. Only <script> is dangerous for us
      ADD_TAGS: ['style'],
      FORBID_ATTR: ['action'],
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: () => true, // allow all custom tag name
        attributeNameCheck: () => true, // allow all attributes of custom tag
        allowCustomizedBuiltInElements: true,
      },
      WHOLE_DOCUMENT: true, // wrap content with <html> or preserve original <html>
      RETURN_DOM: true,
    });

    // to make <html> as viewport root for `position: fixed` elements
    fragment.style.transform = 'scale(1)';

    // disable all input elements
    const inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = Array.from(
      fragment.querySelectorAll('input, textarea, select'),
    );

    for (const input of inputs) {
      input.disabled = true;
    }

    // remove all invalid href of <a>
    const links = fragment.querySelectorAll('a');

    for (const link of links) {
      const href = link.getAttribute('href');

      if (href?.startsWith('#') && !fragment.querySelector(decodeURIComponent(href))) {
        link.removeAttribute('href');
      }
    }

    return fragment as HTMLHtmlElement;
  }

  createRangeAnnotation(color: string) {
    if (!this.selection) {
      throw new Error('no selection');
    }

    const { range } = this.selection;

    this.html.createAnnotation({
      type: AnnotationTypes.HtmlRange,
      color,
      range: [
        { selector: this.getUniqueSelector(range.startContainer as HTMLElement), offset: range.startOffset },
        { selector: this.getUniqueSelector(range.endContainer as HTMLElement), offset: range.endOffset },
      ],
    });
  }

  jumpToAnnotation(annotation: AnnotationVO) {
    let el: HTMLElement | null = null;

    switch (annotation.type) {
      case AnnotationTypes.HtmlRange:
        el = this.shadowRoot.querySelector(annotation.range[0].selector);
        break;
      default:
        throw new Error('unknown annotation type');
    }

    if (!el) {
      return;
    }

    el.scrollIntoView();
  }
}
