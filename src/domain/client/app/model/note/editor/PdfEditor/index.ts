import type { PDFDocumentProxy } from 'pdfjs-dist';
import { autorun, computed, observable, runInAction, toJS, when } from 'mobx';
import assert from 'assert';
import z from 'zod';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor from '../BaseEditor';
import PDFDocumentFactory from '../../../base/PDFDocumentFactory';
import PageTextManager from './PageTextManager';
import TextFinder, { optionsSchema as textFinderSchema } from './TextFinder';
import BodyEditor, { schema as bodyEditorSchema } from './BodyEditor';
import AnnotationManager, { schema as annotationSchema } from './AnnotationManager';
import OutlineList, { uiStateSchema as outlineSchema } from './OutlineList';
import SvgAnnotationEditor, { optionsSchema as svgAnnotationEditorSchema } from './SvgAnnotationEditor';

export type { OutlineItem } from './OutlineList';

const uiStateSchema = z
  .object({
    progress: z.string().optional().catch(undefined), // 当前浏览的进度。通常是一个 pdf hash
    body: bodyEditorSchema.optional().catch(undefined),
    annotations: annotationSchema.optional().catch(undefined),
    outline: outlineSchema.optional().catch(undefined),
    textFinder: textFinderSchema.optional().catch(undefined),
    svgEditor: svgAnnotationEditorSchema.optional().catch(undefined),
    newAnnotationColor: z.string().optional().catch(undefined),
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
        this.body.init(uiState.body);
        this.outline.init(uiState.outline);
        this.textFinder.init(uiState.textFinder);
        this.svgEditor.init(uiState.svgEditor);
        this.progress = uiState.progress;

        if (uiState.newAnnotationColor) {
          this.newAnnotationColor = uiState.newAnnotationColor;
        }
      }

      this.isUIStateReady = true;
    });

    autorun(
      () => {
        this.saveUIState({
          body: this.body.uiState,
          annotations: this.annotation.uiState,
          outline: toJS(this.outline.uiState),
          progress: this.progress,
          textFinder: toJS(this.textFinder.options),
          svgEditor: toJS(this.svgEditor.options),
        });
      },
      { signal: this.destroyController.signal },
    );
  }

  public override destroy() {
    this.docFactory.revoke(this.noteId);
    this.textFinder.destroy();
    this.texts.destroy();
    this.outline.destroy();
    this.annotation.destroy();
    this.saveUIState.flush();
    super.destroy();
  }
}
