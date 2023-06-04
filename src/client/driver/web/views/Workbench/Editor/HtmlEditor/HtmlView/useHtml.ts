import DOMPurify from 'dompurify';
import { useEffect } from 'react';

import type HtmlEditor from 'model/material/HtmlEditor';

function processStyles(root: HTMLHtmlElement) {
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

function filterHtml(html: string) {
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

export default function useHtml(editor: HtmlEditor, shadowRoot: ShadowRoot | null) {
  const html = editor.entity?.html;

  useEffect(() => {
    if (!shadowRoot) {
      return;
    }

    if (editor.documentElement instanceof HTMLHtmlElement) {
      shadowRoot.replaceChildren(editor.documentElement);
    } else if (typeof html === 'string') {
      const documentElement = filterHtml(html);
      processStyles(documentElement);
      editor.documentElement = documentElement;
      shadowRoot.replaceChildren(documentElement);
    }
  }, [editor, html, shadowRoot]);
}
