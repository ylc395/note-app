import { action, computed, observable } from 'mobx';
import assert from 'assert';

import BaseEditor from '../BaseEditor';
import LocalUploader, { type File } from './LocalUploader';
import RemoteUploader from './RemoteUploader';
import DomainEventBus from '../../EventBus';

export default class MarkdownEditor extends BaseEditor {
  public override mimeType = null;

  @observable public accessor remoteUploader: RemoteUploader | undefined;

  @observable.ref public accessor localUploader: LocalUploader | undefined;

  @computed
  public get isUploading() {
    return Boolean(this.localUploader || this.remoteUploader);
  }

  private upgradeTo(mimeType: string) {
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, {
      id: this.noteId,
      source: this,
      payload: { mimeType },
    });

    this.tile.replace(this, { entityId: this.noteId, mimeType });
  }

  @action
  public initFileUploader(file: File) {
    assert(!this.localUploader);

    this.localUploader = new LocalUploader({
      file,
      noteId: this.noteId,

      onUploaded: () => {
        this.upgradeTo(file.mimeType);
      },
    });
  }

  @action.bound
  public initRemoteUploader() {
    assert(!this.remoteUploader);

    this.remoteUploader = new RemoteUploader({
      noteId: this.noteId,
      onUploaded: ({ mimeType }) => {
        this.upgradeTo(mimeType);
      },
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
