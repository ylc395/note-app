import { action, computed, observable } from 'mobx';

import BaseEditor from '../BaseEditor';
import LocalUploader, { type File } from './LocalUploader';
import RemoteUploader from './RemoteUploader';

export default class MarkdownEditor extends BaseEditor {
  public override mimeType = null;

  @observable public accessor remoteUploader: RemoteUploader | undefined;

  @observable.ref public accessor localUploader: LocalUploader | undefined;

  @computed
  public get isUploading() {
    return Boolean(this.localUploader || this.remoteUploader);
  }

  @action
  public initFileUploader(file: File) {
    this.localUploader = new LocalUploader({
      file,
      noteId: this.noteId,

      onUploaded: () => {
        this.tile.replace(this, {
          entityId: this.noteId,
          mimeType: file.mimeType,
        });
      },
    });
  }

  @action
  public initRemoteUploader() {
    this.remoteUploader = new RemoteUploader();
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
