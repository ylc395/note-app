import type { NodeView } from '@milkdown/prose/view';
import type { Node } from '@milkdown/prose/model';
import { FileVO } from '@domain/shared/model/file';
import { container } from 'tsyringe';
import { token as remoteToken } from '@domain/client/common/infra/rpc';
import { parseAppUrl } from '@domain/shared/infra/markdown/url';

export default class MultimediaNodeView implements NodeView {
  private remote = container.resolve(remoteToken);
  public readonly dom = document.createElement('span');
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
    const parsed = parseAppUrl(this.url);

    if (!parsed) {
      return;
    }

    const file = await this.remote.file.queryOne.query(parsed.id);
    const el = this.createMediaElement(file);
    this.dom.replaceChildren(el);
  }

  public update(node: Node) {
    const url: string = node.attrs.src || '';

    if (url === this.url) {
      return false;
    }

    this.node = node;
    this.mount();

    return true;
  }

  private createMediaElement({ mimeType }: FileVO) {
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

    mediaEl.src = this.url;

    return mediaEl;
  }
}
