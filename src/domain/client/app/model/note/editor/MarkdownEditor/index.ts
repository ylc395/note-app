import { action, autorun, computed, observable, reaction, toJS } from 'mobx';
import assert from 'assert';
import { debounce } from 'lodash-es';

import BaseEditor from '../BaseEditor';
import Uploader from '../Uploader';
import z from 'zod';

const uiStateSchema = z.object({
  scroll: z.object({ x: z.number(), y: z.number() }).optional().catch(undefined),
  cursorPos: z.object({ anchor: z.number(), head: z.number() }).optional().catch(undefined),
});

export default class MarkdownEditor extends BaseEditor {
  constructor(...args: ConstructorParameters<typeof BaseEditor>) {
    super(...args);

    reaction(
      () => this.isEmptyBody,
      debounce((isEmptyBody) => (isEmptyBody ? this.initUploader() : this.removeUploader()), 800),
      { signal: this.destroyController.signal, fireImmediately: true },
    );

    this.initUIState();
  }

  @observable
  public accessor uiState: z.infer<typeof uiStateSchema> | undefined;

  @computed
  public get isReady() {
    return Boolean(this.value.data && this.uiState);
  }

  private async initUIState() {
    const uiState = await this.getUIState(uiStateSchema);
    this.uiState = uiState || {};

    autorun(
      () => {
        if (this.uiState) {
          this.saveUIState(toJS(this.uiState));
        }
      },
      { signal: this.destroyController.signal },
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

    this.fileUploader.eventBus.on(Uploader.EventNames.Downloaded, this.upgrade.bind(this, true), { signal });
    this.fileUploader.eventBus.on(Uploader.EventNames.Uploaded, this.upgrade.bind(this), { signal });
  }

  // 从 markdown 编辑器升级为另一种专用编辑器
  @action
  private upgrade(isPreview = false) {
    const { fileUploader } = this;
    const mimeType = fileUploader?.file?.mimeType;
    assert(fileUploader && mimeType);

    this.removeUploader(); // 提前移除 uploader，免得随后该编辑器 destroy 影响了 uploader

    this.tile.replace(this, {
      noteId: this.noteId,
      mimeType,
      value: this.value.data,
      uploader: isPreview ? fileUploader : undefined,
      path: this.path.data,
    });
  }
}
