import { container } from 'tsyringe';
import type { NodeView } from '@milkdown/prose/view';
import type { Node } from '@milkdown/prose/model';

import FileManager from './FileManager';

export default class MultimediaNodeView implements NodeView {
  private readonly fileManager = container.resolve(FileManager);
  readonly dom = document.createElement('span');
  constructor(private node: Node) {
    this.mount();
  }

  private get url() {
    const { src } = this.node.attrs;

    if (typeof src !== 'string') {
      return '';
    }

    return src;
  }

  private async mount() {
    const file = await this.fileManager.get(this.url);
    const el = this.createMediaElement(file);

    this.dom.replaceChildren(el);
  }

  update(node: Node) {
    const url: string = node.attrs.src || '';

    if (url === this.url) {
      return false;
    }

    this.fileManager.remove(this.url);
    this.node = node;
    this.mount();

    return true;
  }

  destroy() {
    this.fileManager.remove(this.url);
  }

  private createMediaElement({ mimeType, blobUrl }: { mimeType: string; blobUrl?: string }) {
    let mediaEl: HTMLImageElement | HTMLAudioElement | HTMLVideoElement;

    if (mimeType.startsWith('audio')) {
      mediaEl = document.createElement('audio');
    } else if (mimeType.startsWith('video')) {
      mediaEl = document.createElement('video');
    } else {
      mediaEl = document.createElement('img');
    }

    if (!(mediaEl instanceof HTMLImageElement)) {
      mediaEl.controls = true;
    }

    if (blobUrl) {
      mediaEl.src = blobUrl;
    }

    return mediaEl;
  }
}
