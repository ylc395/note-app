import { type Root, createRoot } from 'react-dom/client';

import type { TaskResult } from 'domain/model/task';
import type ClipService from 'domain/service/ClipService';
import Modal from './Modal';

const MODAL_OPEN_CLASSNAME = 'star-clipper-modal-open';

export default class Previewer {
  private modalRoot?: HTMLElement;
  private reactRoot?: Root;
  private style?: HTMLStyleElement;
  constructor(private readonly clipService: ClipService) {
    clipService.on('preview', this.openModal.bind(this));
    clipService.on('done', this.closeModal.bind(this));
  }

  private openModal(taskResult: TaskResult) {
    this.modalRoot = document.createElement('div');
    this.modalRoot.style.all = 'initial';
    this.modalRoot.attachShadow({ mode: 'open' });

    document.body.append(this.modalRoot);
    document.body.classList.add(MODAL_OPEN_CLASSNAME);
    this.style = document.createElement('style');
    this.style.innerHTML = `.${MODAL_OPEN_CLASSNAME} { overflow-y: hidden !important; }`;
    document.head.append(this.style);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.reactRoot = createRoot(this.modalRoot.shadowRoot!);
    this.reactRoot.render(<Modal taskResult={taskResult} clipService={this.clipService} />);
  }

  private closeModal() {
    this.reactRoot?.unmount();
    this.modalRoot?.remove();
    this.style?.remove();
    document.body.classList.remove(MODAL_OPEN_CLASSNAME);
  }

  static processHtml(html: string) {
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
