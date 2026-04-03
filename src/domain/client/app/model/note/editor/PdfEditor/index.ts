import type { PDFDocumentProxy } from 'pdfjs-dist';
import { autorun, computed, observable, runInAction, untracked, when } from 'mobx';
import assert from 'assert';
import z from 'zod';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor from '../BaseEditor';
import PDFDocumentFactory from '../../../base/PDFDocumentFactory';
import PageTextManager from './PageTextManager';
import TextFinder from './TextFinder';
import AnnotationManager from './AnnotationManager';
import OutlineList from './OutlineList';
import SvgAnnotationEditor from './SvgAnnotationEditor';
import BodyEditor from './BodyEditor';

export type { OutlineItem } from './OutlineList';

const uiStateSchema = z
  .object({
    progress: z.string().optional().catch(undefined), // 当前浏览的进度。通常是一个 pdf hash
    newAnnotationColor: z.string().optional().catch(undefined),
    body: BodyEditor.schema.optional().catch(undefined),
    annotations: AnnotationManager.schema.optional().catch(undefined),
    outline: OutlineList.schema.optional().catch(undefined),
    textFinder: TextFinder.schema.optional().catch(undefined),
    svgEditor: SvgAnnotationEditor.schema.optional().catch(undefined),
  })
  .catch({});

export default class PdfEditor extends BaseEditor {
  constructor(...args: ConstructorParameters<typeof BaseEditor>) {
    super(...args);

    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
    this.initUIState();
  }

  private readonly docFactory = container.resolve(PDFDocumentFactory);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  @observable public accessor progress: string | undefined;

  @observable public accessor newAnnotationColor = 'yellow';

  @observable private accessor isUIStateReady = false;

  public readonly texts = new PageTextManager(this.noteId);

  public readonly annotation = new AnnotationManager(this.noteId);

  public readonly outline = new OutlineList(this.noteId, this.annotation);

  public readonly body = new BodyEditor();

  public readonly textFinder = new TextFinder(this.texts);

  public readonly svgEditor = new SvgAnnotationEditor(this.annotation);

  @computed
  public get isReady() {
    return Boolean(this.doc) && this.texts.isReady && this.isUIStateReady;
  }

  private async init() {
    assert(this.blob.result.data);

    const doc = await this.docFactory.create({
      key: this.noteId,
      blob: this.blob.result.data,
    });

    this.texts.setDoc(doc);
    this.outline.setDoc(doc);

    runInAction(() => {
      this.doc = doc;
    });
  }

  private async initUIState() {
    const uiState = await this.getUIState(uiStateSchema);

    runInAction(() => {
      if (uiState) {
        this.annotation.init(uiState.annotations);
        this.outline.init(uiState.outline);
        this.textFinder.init(uiState.textFinder);
        this.svgEditor.init(uiState.svgEditor);
        this.body.init(uiState.body);
        this.progress = uiState.progress;

        if (uiState.newAnnotationColor) {
          this.newAnnotationColor = uiState.newAnnotationColor;
        }
      }
    });

    autorun(
      () => {
        const data = {
          body: this.body.toJSON(),
          annotations: this.annotation.toJSON(),
          outline: this.outline.toJSON(),
          progress: this.progress,
          textFinder: this.textFinder.toJSON(),
          svgEditor: this.svgEditor.toJSON(),
        };

        untracked(() => {
          if (this.isUIStateReady) {
            this.saveUIState(data);
          }
        });
      },
      { signal: this.destroyController.signal },
    );

    runInAction(() => {
      this.isUIStateReady = true;
    });
  }

  public override destroy() {
    if (this.doc) {
      this.docFactory.revoke(this.noteId);
    }

    this.textFinder.destroy();
    this.texts.destroy();
    this.outline.destroy();
    this.annotation.destroy();
    this.saveUIState.flush();
    super.destroy();
  }
}
