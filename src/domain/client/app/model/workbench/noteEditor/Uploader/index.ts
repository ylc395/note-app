import { action, computed, observable } from 'mobx';

import type { NoteVO } from '#domain/shared/model/note';
import { FileDTO } from '#domain/shared/model/file';

import Downloader, { type DownloadedFile } from './Downloader';
import EventBus from '#domain/client/shared/infra/EventBus';
import FileNoteUploader from '../../../note/FileNoteUploader';

export type FileToUpload = Required<Pick<FileDTO, 'mimeType' | 'data' | 'name'>> & { hash: string; sourceUrl?: string };

enum EventNames {
  Downloaded = 'uploader.downloaded',
  Uploaded = 'uploader.uploaded',
}

// 上传一个本地或在线资源（需先下载）
export default class ResourceManager {
  constructor(private readonly options: { noteId: NoteVO['id'] }) {}

  public readonly eventBus = new EventBus<{
    [EventNames.Downloaded]: never;
    [EventNames.Uploaded]: never;
  }>('uploader');

  private readonly destroyController = new AbortController();

  @observable.ref public accessor downloader: Downloader | undefined;

  @action
  public initDownloader() {
    this.downloader = new Downloader({
      onDownloaded: this.handleDownloaded.bind(this),
    });
  }

  @action
  public clearDownloader() {
    this.downloader?.cancel();
    this.downloader = undefined;
  }

  @computed
  public get duplicatedNotes() {
    return this.uploader?.duplicatedFiles[0]?.notes;
  }

  private async handleDownloaded(file: DownloadedFile) {
    await this.setFile(file, false);
    this.eventBus.emit(EventNames.Downloaded);
  }

  @observable.ref
  private accessor uploader: FileNoteUploader | undefined;

  public get file() {
    return this.uploader?.files[0];
  }

  public async setFile(file: FileDTO, tryUpload = true) {
    this.uploader = new FileNoteUploader({
      files: [file],
      noteId: this.options.noteId,
      onFinish: (err) => {
        if (!err) {
          this.eventBus.emit(EventNames.Uploaded);
        }
      },
    });

    if (!tryUpload || !(await this.uploader.canUpload())) {
      return;
    }

    return this.uploader.upload();
  }

  @action
  public clearFile() {
    this.uploader = undefined;
  }

  public upload() {
    this.uploader?.upload();
  }

  public destroy() {
    this.destroyController.abort();
    this.downloader?.cancel();
    this.eventBus.clearListeners();
  }

  public static readonly EventNames = EventNames;
}
