import type { PDFDocumentProxy } from 'pdfjs-dist';
import { action, computed, observable, reaction, runInAction, when } from 'mobx';
import assert from 'assert';
import z from 'zod';

import container from '#utils/singletonContainer';
import { MimeTypes } from '#domain/shared/model/file';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';

import BaseEditor, { type Options } from '../BaseEditor';
import DocumentFactory from './DocumentFactory';
import OutlineList from './OutlineList';
import AnnotationManager from './AnnotationManager';
import TextFinder from './TextFinder';
import PageTextManager from './PageTextManager';
import type Tile from '../../../Workbench/Tile';

export type { OutlineItem } from './OutlineList';

export enum Panel {
  Body = 'body',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

export type TogglablePanel = Panel.Annotation | Panel.Body;

export default class PdfEditor extends BaseEditor {
  constructor(tile: Tile, options: Options) {
    super(tile, options);
    when(() => this.blob.result.isSuccess, this.init.bind(this), { signal: this.destroyController.signal });

    reaction(
      () => this.uiState.isReady && this.uiState.get('panelsSize')?.[Panel.Annotation]?.isVisible,
      action((v) => (this.annotation.isEnabled = Boolean(v))),
      { fireImmediately: true },
    );
  }

  public readonly uiState = new PersistedMap(
    `${this.noteId}-pdfEditor`,
    z.object({
      panelsSize: z
        .object({
          [Panel.Annotation]: z.object({ isVisible: z.boolean(), size: z.number() }),
          [Panel.Body]: z.object({ isVisible: z.boolean(), size: z.number() }),
        })
        .partial()
        .catch({}),
    }),
  );

  @action
  public togglePanel(id: TogglablePanel) {
    const panels = this.uiState.get('panelsSize');
    const panel = panels[id];

    if (!panel) {
      panels[id] = { isVisible: true, size: 30 };
    } else {
      panel.isVisible = !panel.isVisible;
    }

    this.uiState.set('panelsSize', panels);
  }

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
  }

  public static isTogglablePanel(id: string): id is TogglablePanel {
    return ([Panel.Annotation, Panel.Body] as string[]).includes(id);
  }
}
