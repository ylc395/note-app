import { action, computed, observable } from 'mobx';
import assert from 'assert';

import BaseEditor from '../BaseEditor';
import LocalUploader, { type File } from './LocalUploader';
import RemoteUploader from './RemoteUploader';
import DomainEventBus from '../../EventBus';
import type { FileDTO } from '#domain/shared/model/file';

// todo: 把这里的方法移到父类上
export default class MarkdownEditor extends BaseEditor {
  public override mimeType = null;

  @observable public accessor remoteUploader: RemoteUploader | undefined;

  @observable.ref public accessor localUploader: LocalUploader | undefined;

  @computed
  public get isUploading() {
    return Boolean(this.localUploader || this.remoteUploader);
  }

  private upgradeTo(isPreview = false, file: FileDTO) {
    this.tile.replace(this, { entityId: this.noteId, ...file });

    if (!isPreview) {
      this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
        id: this.noteId,
        source: this,
        payload: { mimeType: file.mimeType },
      });
    }
  }

  @action
  public initFileUploader(file: File) {
    assert(!this.localUploader);

    this.localUploader = new LocalUploader({
      file,
      noteId: this.noteId,

      onUploaded: () => {
        this.upgradeTo(false, file);
      },
    });
  }

  @action.bound
  public initRemoteUploader() {
    assert(!this.remoteUploader);

    this.remoteUploader = new RemoteUploader({
      noteId: this.noteId,
      onDownloaded: this.upgradeTo.bind(this, true),
    });
  }

  public override destroy() {
    this.resetUploader();
    super.destroy();
  }

  @action.bound
  public resetUploader() {
    this.localUploader?.destroy();
    this.localUploader = undefined;

    this.remoteUploader?.destroy();
    this.remoteUploader = undefined;
  }
}
