import { when } from 'mobx';
import { container } from 'tsyringe';

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

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  private init() {
    this.cancelLoad?.();

    const editorService = container.resolve(EditorService);
    const editorId = this.getAttribute('editor-id');
    const editor = editorId && editorService.getEditorById<HtmlEditor>(editorId);

    if (!editor) {
      throw new Error('invalid editorId');
    }

    if (editor.doc instanceof HTMLElement) {
      this.loadHtml(editor.doc);
      return;
    }

    this.cancelLoad = when(
      () => typeof editor.entity?.html === 'string',
      () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        editor.doc = this.loadHtml(editor.entity!.html);
      },
    );
  }

  private loadHtml(html: string | HTMLElement) {
    if (!this.shadowRoot) {
      throw new Error('no shadowRoot');
    }

    let docElement: HTMLElement;

    if (typeof html === 'string') {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');

      HtmlViewer.processStyles(doc);
      docElement = doc.documentElement;
    } else {
      docElement = html;
    }

    docElement.style.userSelect = 'text';
    this.shadowRoot.replaceChildren(docElement);

    return docElement;
  }

  connectedCallback() {
    if (this.isConnected) {
      this.init();
      // shadow dom will inherit styles from outside
      // reset all to stop inheriting
      this.className = 'all-initial';
    } else {
      this.cancelLoad?.();
    }
  }

  attributeChangedCallback(name: string) {
    if (name === 'editor-id') {
      this.init();
    }
  }

  private static processStyles(doc: Document) {
    const styles = doc.querySelectorAll('style');

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
}
