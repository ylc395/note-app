import type { PDFDocumentProxy } from 'pdfjs-dist';
import { action, computed, observable, reaction, runInAction, when } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationManager from './AnnotationManager';
import TextFinder from './TextFinder';
import PageTextManager from './PageTextManager';
import type Tile from '../../../Workbench/Tile';
import UIState, { Panel } from './UIState';

export type { OutlineItem } from './OutlineList';

export default class PdfEditor extends BaseEditor {
  constructor(tile: Tile, options: Options) {
    super(tile, options);
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });

    reaction(
      () => this.uiState.isReady && this.uiState.panels?.[Panel.Annotation]?.isVisible,
      action((v) => (this.annotation.isEnabled = Boolean(v))),
      { fireImmediately: true },
    );
  }

  public readonly uiState = new UIState(this.noteId);

  private readonly docFactory = container.resolve(DocumentFactory);

  public readonly texts = new PageTextManager(this.noteId);

  public readonly annotation = new AnnotationManager(this.noteId);

  public readonly outline = new OutlineList(this.annotation);

  public readonly textFinder = new TextFinder(this.texts);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  @computed
  public get isReady() {
    return Boolean(this.doc) && this.texts.isReady;
  }

  private async init() {
    assert(this.blob.result.data);

    const doc = await this.docFactory.create({
      noteId: this.noteId,
      blob: this.blob.result.data,
    });

    this.texts.init(doc);

    runInAction(() => {
      this.doc = doc;
    });
  }

  public override destroy() {
    super.destroy();
    this.docFactory.revoke(this.noteId);
    this.textFinder.destroy();
    this.texts.destroy();
    this.outline.destroy();
    this.annotation.destroy();
    this.uiState.destroy();
  }
}
