import { action, computed, reaction } from 'mobx';
import assert from 'assert';
import { debounce } from 'lodash-es';

import BaseEditor, { type Options } from '../BaseEditor';
import type Tile from '../../../Workbench/Tile';
import Uploader from '../Uploader';

export default class MarkdownEditor extends BaseEditor {
  constructor(tile: Tile, options: Options) {
    super(tile, options);

    reaction(
      () => this.isEmptyBody,
      debounce((isEmptyBody) => (isEmptyBody ? this.initUploader() : this.removeUploader()), 800),
      { signal: this.destroyController.signal, fireImmediately: true },
    );
  }

  public override mimeType = null;

  private uploaderController?: AbortController;

  private get isEmptyBody() {
    return this.value.data?.body === '';
  }

  @computed
  public get isUploading() {
    return Boolean(this.fileUploader?.file || this.fileUploader?.downloader);
  }

  @action
  private removeUploader() {
    this.fileUploader = undefined;
    this.uploaderController?.abort();
  }

  @action
  private initUploader() {
    this.fileUploader = new Uploader({ noteId: this.noteId });
    this.uploaderController = new AbortController();
    const signal = AbortSignal.any([this.uploaderController.signal, this.destroyController.signal]);

    this.fileUploader.eventBus.on('downloaded', this.upgrade.bind(this, true), { signal });
    this.fileUploader.eventBus.on('uploaded', this.upgrade.bind(this), { signal });
  }

  @action
  private upgrade(isPreview = false) {
    const { fileUploader } = this;
    const mimeType = fileUploader?.file?.mimeType;
    assert(fileUploader && mimeType);

    this.removeUploader(); // 提前移除 uploader，免得随后该编辑器 destroy 影响了 uploader

    this.tile.replace(this, {
      entityId: this.noteId,
      mimeType,
      value: this.value.data,
      uploader: isPreview ? fileUploader : undefined,
      path: this.path.data,
    });
  }
}
