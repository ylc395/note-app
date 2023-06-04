import { when } from 'mobx';
import { container } from 'tsyringe';
import DOMPurify from 'dompurify';

import type HtmlEditor from 'model/material/HtmlEditor';
import EditorService from 'service/EditorService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      ['html-viewer']: { 'editor-id': HtmlEditor['id'] };
    }
  }
}

export default class HtmlViewer extends HTMLElement {
  private cancelLoad?: ReturnType<typeof when>;
  private readonly wrapper: HTMLElement;

  constructor() {
    super();
    this.wrapper = document.createElement('div');
    this.wrapper.attachShadow({ mode: 'open' });
    // shadow dom will inherit styles from outside
    // reset all to stop inheriting
    this.wrapper.className = 'select-text';
  }

  private init() {
    this.cancelLoad?.();

    const editorService = container.resolve(EditorService);
    const editorId = this.getAttribute('editor-id');
    const editor = editorId && editorService.getEditorById<HtmlEditor>(editorId);

    if (!editor) {
      throw new Error('invalid editorId');
    }

    if (editor.documentElement instanceof HTMLHtmlElement) {
      this.loadHtml(editor.documentElement);
      return;
    }

    this.cancelLoad = when(
      () => typeof editor.entity?.html === 'string',
      () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        editor.documentElement = this.loadHtml(editor.entity!.html);
      },
    );
  }

  private loadHtml(html: string | HTMLHtmlElement) {
    const shadowRoot = this.wrapper.shadowRoot;

    if (!shadowRoot) {
      throw new Error('no shadowRoot');
    }

    let documentElement: HTMLHtmlElement;

    if (typeof html === 'string') {
      documentElement = HtmlViewer.filterHtml(html);
      HtmlViewer.processStyles(documentElement);
    } else {
      documentElement = html;
    }

    shadowRoot.replaceChildren(documentElement);

    return documentElement;
  }

  connectedCallback() {
    if (this.isConnected) {
      this.init();
      this.append(this.wrapper);
      this.classList.add('all-initial');
    } else {
      this.cancelLoad?.();
    }
  }

  attributeChangedCallback(name: string) {
    if (name === 'editor-id') {
      this.init();
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

  static get observedAttributes() {
    return ['editor-id'];
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
