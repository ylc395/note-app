import { when } from 'mobx';
import DOMPurify from 'dompurify';

import { ui } from 'web/infra/ui';
import type HtmlEditor from 'model/material/HtmlEditor';

import RangeSelectable, { Options as CommonOptions } from '../../common/RangeSelectable';

interface Options extends CommonOptions {
  editor: HtmlEditor;
  rootEl: HTMLElement;
}

export default class HtmlViewer extends RangeSelectable {
  private readonly shadowRoot: ShadowRoot;
  private stopLoadingHtml?: ReturnType<typeof when>;

  constructor(protected readonly options: Options) {
    super(options);
    this.shadowRoot = options.rootEl.shadowRoot || options.rootEl.attachShadow({ mode: 'open' });
    this.initContent();
    this.rootEl.addEventListener('click', this.handleClick);
  }

  protected get rootEl() {
    return this.options.rootEl;
  }

  private readonly handleClick = (e: MouseEvent) => {
    // can not get event target by `e.target` when bubbling along the shadow dom
    // so we use event path
    const eventPath = e.composedPath() as HTMLElement[];
    const anchorEl = eventPath.find((el) => el.tagName.toLowerCase() === 'a' && el.getAttribute('href'));

    if (anchorEl) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ui.openNewWindow(anchorEl.getAttribute('href')!);
      e.preventDefault();
    }
  };

  destroy(): void {
    this.rootEl.removeEventListener('click', this.handleClick);
    this.stopLoadingHtml?.();
    super.destroy();
  }

  private initContent() {
    const { editor } = this.options;

    if (editor.documentElement instanceof HTMLHtmlElement) {
      this.shadowRoot.replaceChildren(editor.documentElement);
    } else {
      const { editor } = this.options;
      this.stopLoadingHtml = when(
        () => Boolean(editor.entity),
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const documentElement = HtmlViewer.filterHtml(editor.entity!.html);
          HtmlViewer.processStyles(documentElement);
          editor.documentElement = documentElement;
          this.shadowRoot.replaceChildren(documentElement);
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
}
