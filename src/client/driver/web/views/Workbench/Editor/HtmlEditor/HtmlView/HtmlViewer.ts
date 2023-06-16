import { when, computed, makeObservable, observable, action } from 'mobx';
import DOMPurify from 'dompurify';
import getCssSelector from 'css-selector-generator';
import { toPng } from 'html-to-image';
import debounce from 'lodash/debounce';

import { ui } from 'web/infra/ui';
import { AnnotationTypes, AnnotationVO } from 'interface/material';
import type HtmlEditorView from 'model/material/HtmlEditorView';

import RangeSelector, { type RangeSelectEvent } from '../../common/RangeSelector';
import ElementSelector from '../../common/ElementSelector';

interface Options {
  editorView: HtmlEditorView;
  rootEl: HTMLElement;
  editorRootEl: HTMLElement;
}

export default class HtmlViewer {
  readonly shadowRoot: ShadowRoot;
  private stopLoadingHtml?: ReturnType<typeof when>;
  readonly elementSelector: ElementSelector;
  private readonly rangeSelector: RangeSelector;

  @observable.ref
  selection: RangeSelectEvent | null = null;

  get editor() {
    return this.options.editorView.editor;
  }

  get editorView() {
    return this.options.editorView;
  }

  @computed
  get title() {
    let text = this.editor.entity?.metadata.sourceUrl || '未命名 HTML 文档';
    let icon = this.editor.entity?.metadata.icon || '';

    if (this.editorView.documentElement instanceof HTMLHtmlElement) {
      const titleContent = this.editorView.documentElement.querySelector('title')?.innerText;

      if (titleContent) {
        text = titleContent;
      }

      const iconContent = this.editorView.documentElement.querySelector('link[rel="icon"]')?.getAttribute('href');

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

    this.elementSelector = new ElementSelector({
      selectableRoot: this.shadowRoot,
      onSelect: this.handleElementSelect,
      cancelableRoot: options.editorRootEl,
    });

    this.rangeSelector = new RangeSelector({
      rootEl: this.shadowRoot,
      onTextSelectionChanged: action((e) => (this.selection = e)),
    });
    this.initContent();
  }

  private readonly updateScrollState = action((e: Event) => {
    const { scrollTop } = e.target as HTMLElement;
    this.editorView.updateState({ scrollTop });
  });

  private getUniqueSelector(el: HTMLElement) {
    return getCssSelector(el, { root: this.shadowRoot }).replace(':root > :nth-child(1)', 'html');
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
    this.shadowRoot.removeEventListener('click', this.hijackClick);
    this.elementSelector.disable();
    this.rangeSelector.destroy();
    this.stopLoadingHtml?.();
    this.options.editorRootEl.removeEventListener('scroll', this.updateScrollState);
  }

  private initContent() {
    if (this.editorView.documentElement instanceof HTMLHtmlElement) {
      this.updateContent(this.editorView.documentElement);
    } else {
      this.stopLoadingHtml = when(
        () => Boolean(this.editor.entity),
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const documentElement = HtmlViewer.filterHtml(this.editor.entity!.html);
          HtmlViewer.processStyles(documentElement);
          this.editorView.documentElement = documentElement;
          this.updateContent(documentElement);
        },
      );
    }
  }

  private updateContent(html: HTMLHtmlElement) {
    this.shadowRoot.replaceChildren(html);
    this.options.editorRootEl.scrollTop = this.editorView.state.scrollTop;
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
    const uniqueSelector = this.getUniqueSelector(el);
    const existed = this.editor.annotations.find(
      (annotation) => annotation.type === AnnotationTypes.HtmlElement && annotation.selector === uniqueSelector,
    );

    if (existed) {
      return false;
    }

    await this.editor.createAnnotation({
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
        { selector: this.getUniqueSelector(range.startContainer as HTMLElement), offset: range.startOffset },
        { selector: this.getUniqueSelector(range.endContainer as HTMLElement), offset: range.endOffset },
      ],
    });
  }

  jumpToAnnotation(annotation: AnnotationVO) {
    let el: HTMLElement | null = null;

    switch (annotation.type) {
      case AnnotationTypes.HtmlElement:
        el = this.shadowRoot.querySelector(annotation.selector);
        break;
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
