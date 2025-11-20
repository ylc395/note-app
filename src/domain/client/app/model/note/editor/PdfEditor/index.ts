import type { PDFDocumentProxy } from 'pdfjs-dist';
import { autorun, computed, observable, runInAction, when } from 'mobx';
import assert from 'assert';
import { debounce } from 'lodash-es';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationManager from './AnnotationManager';
import TextFinder from './TextFinder';
import PageTextManager from './PageTextManager';
import type Tile from '../../../Workbench/Tile';
import { Panel, schema as uiSchema, storeName, type UIState } from './uiState';
import BodyEditor from './BodyEditor';

export type { OutlineItem } from './OutlineList';

export default class PdfEditor extends BaseEditor {
  constructor(tile: Tile, options: Options) {
    super(tile, options);
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });

    this.initUIState();
  }

  private readonly db = container.resolve(documentDbToken);

  private readonly docFactory = container.resolve(DocumentFactory);

  public readonly texts = new PageTextManager(this.noteId);

  public readonly annotation = new AnnotationManager(this.noteId);

  public readonly outline = new OutlineList(this.annotation);

  public readonly body = new BodyEditor();

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

  private async initUIState() {
    const uiState = await this.db.getByKey(storeName, this.noteId, uiSchema);

    if (uiState) {
      this.annotation.initUIState(uiState.panels[Panel.Annotation]);
      this.body.initUIState(uiState.panels[Panel.Body]);
    }

    autorun(
      () => {
        this.saveUIState({
          panels: {
            [Panel.Annotation]: this.annotation.uiState,
            [Panel.Body]: this.body.uiState,
          },
        });
      },
      { signal: this.destroyController.signal },
    );
  }

  private readonly saveUIState = debounce((value: UIState) => {
    this.db.put(storeName, { id: this.noteId, ...value });
  }, 500);

  public override destroy() {
    super.destroy();
    this.docFactory.revoke(this.noteId);
    this.textFinder.destroy();
    this.texts.destroy();
    this.outline.destroy();
    this.annotation.destroy();
    this.saveUIState.flush();
  }
}
