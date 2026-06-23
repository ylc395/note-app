import type { PDFDocumentProxy } from 'pdfjs-dist';
import { action, autorun, computed, observable, runInAction, untracked, when } from 'mobx';
import assert from 'assert';
import z from 'zod';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';

import BaseEditor from '../BaseEditor';
import PDFDocumentFactory, { type PDFDocumentToken } from '../../../base/PDFDocumentFactory';
import PageTextManager from './PageTextManager';
import TextFinder from './TextFinder';
import AnnotationManager from './AnnotationManager';
import OutlineList from './OutlineList';
import SvgAnnotationEditor from './SvgAnnotationEditor';
import BodyEditor from './BodyEditor';
import type { SelectionState } from './selectionState';

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

    when(() => this.entity.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });
    this.initUIState();
  }

  private readonly docFactory = container.resolve(PDFDocumentFactory);

  public override readonly mimeType = MimeTypes.PDF;

  @observable.ref public accessor doc: PDFDocumentProxy | undefined; // this is view-independent

  private loadingPdf?: PDFDocumentToken;

  @observable public accessor progress: string | undefined;

  @observable public accessor newAnnotationColor = 'yellow';

  @observable private accessor isUIStateReady = false;

  public readonly texts = new PageTextManager({
    noteId: this.entityId,
    shouldFetch: (page: number) => this.visiblePages.includes(page),
  });

  public readonly annotation = new AnnotationManager(this.entityId);

  public readonly outline = new OutlineList(this.entityId, this.annotation);

  public readonly body = new BodyEditor();

  public readonly textFinder = new TextFinder(this.entityId, this.texts);

  @observable.ref
  public accessor selection: SelectionState | undefined;

  public readonly svgEditor = new SvgAnnotationEditor(this.annotation);

  @observable.ref
  private accessor visiblePages: Readonly<number[]> = [];

  @action
  public updateVisiblePages(pages: Readonly<number[]>) {
    this.visiblePages = pages;
  }

  @computed
  public get isReady() {
    return Boolean(this.doc) && this.texts.isReady && this.isUIStateReady;
  }

  private async init() {
    assert(this.entity.blob.result.data);

    this.loadingPdf = this.docFactory.create({
      key: this.entityId,
      blob: this.entity.blob.result.data,
    });

    let doc;
    try {
      doc = await this.loadingPdf.doc;
    } catch (e) {
      // doc 加载可能因 destroy 调用了 dispose 而被取消，静默忽略
      if ((e as Error)?.name === 'AbortError') {
        return;
      }
      throw e;
    }

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
    this.loadingPdf?.dispose();

    this.textFinder.destroy();
    this.texts.destroy();
    this.outline.destroy();
    this.annotation.destroy();
    this.saveUIState.flush();
    super.destroy();
  }
}
