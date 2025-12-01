import type { PDFDocumentProxy } from 'pdfjs-dist';
import { autorun, computed, observable, runInAction, toJS, when } from 'mobx';
import assert from 'assert';
import { debounce } from 'lodash-es';
import z from 'zod';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import PageTextManager from './PageTextManager';
import TextFinder, { optionsSchema as textFinderSchema } from './TextFinder';
import BodyEditor, { schema as bodyEditorSchema } from './BodyEditor';
import AnnotationManager, { schema as annotationSchema } from './AnnotationManager';
import OutlineList, { uiStateSchema as outlineSchema } from './OutlineList';
import SvgAnnotationEditor, { optionsSchema as svgAnnotationEditorSchema } from './SvgAnnotationEditor';

import { storeName } from '../uiState';
import type Tile from '../../../Workbench/Tile';

export type { OutlineItem } from './OutlineList';

export enum Panel {
  Body = 'body',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

const uiStateSchema = z
  .object({
    progress: z.unknown().optional().catch(undefined), // 当前浏览的进度。通常是一个 pdf hash
    panels: z
      .object({
        [Panel.Body]: bodyEditorSchema.optional().catch(undefined),
        [Panel.Annotation]: annotationSchema.optional().catch(undefined),
      })
      .optional()
      .catch(undefined),
    outline: outlineSchema.optional().catch(undefined),
    textFinder: textFinderSchema.optional().catch(undefined),
    svgEditor: svgAnnotationEditorSchema.optional().catch(undefined),
    annotationColor: z.string().optional().catch(undefined),
  })
  .catch({});

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

  public readonly svgEditor = new SvgAnnotationEditor(this.annotation);

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  public override readonly mimeType = MimeTypes.PDF;

  @observable public accessor progress: unknown | undefined;

  @observable public accessor annotationColor = 'yellow';

  @observable private accessor isUIStateReady = false;

  @computed
  public get isReady() {
    return Boolean(this.doc) && this.texts.isReady && this.isUIStateReady;
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
    const uiState = await this.db.getByKey(storeName, this.noteId, uiStateSchema);

    runInAction(() => {
      if (uiState) {
        this.annotation.initUIState(uiState.panels?.[Panel.Annotation]);
        this.body.initUIState(uiState.panels?.[Panel.Body]);
        this.outline.initUIState(uiState.outline);
        this.textFinder.initOptions(uiState.textFinder);
        this.svgEditor.initOptions(uiState.svgEditor);
        this.progress = uiState.progress;

        if (uiState.annotationColor) {
          this.annotationColor = uiState.annotationColor;
        }
      }

      this.isUIStateReady = true;
    });

    autorun(
      () => {
        this.saveUIState({
          panels: {
            [Panel.Annotation]: this.annotation.uiState,
            [Panel.Body]: this.body.uiState,
          },
          outline: toJS(this.outline.uiState),
          progress: this.progress,
          textFinder: toJS(this.textFinder.options),
          svgEditor: toJS(this.svgEditor.options),
        });
      },
      { signal: this.destroyController.signal },
    );
  }

  private readonly saveUIState = debounce((value: Record<string, unknown>) => {
    this.db.put(storeName, { ...value, id: this.noteId });
  }, 500);

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
