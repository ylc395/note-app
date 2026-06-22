import { action, autorun, computed, observable, reaction, runInAction, toJS } from 'mobx';
import assert from 'assert';
import { debounce } from 'lodash-es';
import z from 'zod';

import BaseEditor, { type Options } from '../BaseEditor';
import ResourceManager from '../Uploader';
import type { EditorDTO } from '../../BaseEditor/types';

const uiStateSchema = z.object({
  scroll: z.object({ x: z.number(), y: z.number() }).optional().catch(undefined),
  cursorPos: z.object({ anchor: z.number(), head: z.number() }).optional().catch(undefined),
  search: z
    .object({
      enabled: z.boolean().optional(),
      replaceExpanded: z.boolean().optional(),
      currentMatchIndex: z.number().optional(),
      search: z.string().optional(),
      replace: z.string().optional(),
      caseSensitive: z.boolean().optional(),
      literal: z.boolean().optional(),
      regexp: z.boolean().optional(),
      wholeWord: z.boolean().optional(),
    })
    .optional()
    .catch(undefined),
  outline: z
    .object({
      enabled: z.boolean().catch(true),
      size: z.number().catch(20),
      isFloating: z.boolean().optional().catch(undefined),
      floatingSize: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional()
        .catch(undefined),
      floatingPos: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional()
        .catch(undefined),
    })
    .catch({ enabled: true, size: 20 }),
});

export default class MarkdownEditor extends BaseEditor {
  constructor(...args: ConstructorParameters<typeof BaseEditor>) {
    super(...args);

    reaction(
      () => this.isEmptyBody,
      debounce((isEmptyBody) => (isEmptyBody ? this.initUploader() : this.removeUploader(true)), 800),
      { signal: this.destroyController.signal, fireImmediately: true },
    );

    this.initUIState();
  }

  @observable
  public accessor uiState: z.infer<typeof uiStateSchema> | undefined;

  @computed
  public get isReady() {
    return Boolean(this.entity.value.data && this.uiState);
  }

  private async initUIState() {
    const uiState = await this.getUIState(uiStateSchema);

    runInAction(() => {
      this.uiState = uiState || { outline: { enabled: true, size: 20 } };
    });

    autorun(
      () => {
        if (this.uiState) {
          this.saveUIState(toJS(this.uiState));
        }
      },
      { signal: this.destroyController.signal },
    );
  }

  public override mimeType = null;

  private get isEmptyBody() {
    return this.content === '';
  }

  @computed
  public get isUploading() {
    return Boolean(this.resourceManager?.file || this.resourceManager?.downloader);
  }

  private resourceManagerController?: AbortController;

  @action
  private removeUploader(destroy?: boolean) {
    if (destroy) {
      this.resourceManager?.destroy();
    }
    this.resourceManager = undefined;
    this.resourceManagerController?.abort();
  }

  @action
  private initUploader() {
    this.resourceManager = new ResourceManager({ noteId: this.entityId });
    const abortController = (this.resourceManagerController = new AbortController());

    this.resourceManager.eventBus.on(ResourceManager.EventNames.Downloaded, this.upgrade.bind(this, true), {
      signal: abortController.signal,
    });

    this.resourceManager.eventBus.on(ResourceManager.EventNames.Uploaded, this.upgrade.bind(this), {
      signal: abortController.signal,
    });
  }

  // 从 markdown 编辑器升级为另一种专用编辑器
  @action
  private upgrade(isTemp = false) {
    const resourceManager = this.resourceManager;
    const mimeType = resourceManager?.file?.mimeType;

    assert(resourceManager && mimeType);
    this.removeUploader(); // 提前移除 uploader，免得随后该编辑器 destroy 影响了 uploader

    this.tile.replace(this, {
      entityId: this.entityId,
      entityType: this.entity.type,
      mimeType: mimeType,
      value: this.entity.value.data,
      path: this.entity.path.data,
      resourceManager: isTemp ? resourceManager : undefined,
    } satisfies Options & EditorDTO);
  }
}
