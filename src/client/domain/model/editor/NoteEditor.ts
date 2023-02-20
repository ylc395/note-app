import { makeObservable, computed, reaction, action, observable, runInAction } from 'mobx';
import last from 'lodash/last';
import debounce from 'lodash/debounce';

import { EntityTypes } from 'interface/Entity';
import { normalizeTitle, type NoteVO, type NoteBodyVO, type NotePath, NoteBodyDTO, NoteDTO } from 'interface/Note';
import type Window from 'model/windowManager/Window';

import EntityEditor from './EntityEditor';

export enum Events {
  TitleUpdated = 'noteEditor.updated.title',
  BodyUpdated = 'noteEditor.updated.body',
  Activated = 'noteEditor.activated',
}

export interface Entity {
  body: NoteBodyVO;
  metadata: NoteVO;
}

export default class NoteEditor extends EntityEditor<Entity> {
  private readonly disposeReaction: ReturnType<typeof reaction>;
  protected readonly entityType: EntityTypes = EntityTypes.Note;
  @observable breadcrumb?: NotePath;
  constructor(window: Window, noteId: NoteVO['id']) {
    super(window, noteId);
    makeObservable(this);

    this.on(Events.Activated, this.loadBreadcrumb.bind(this));
    this.disposeReaction = reaction(
      () => this.isActive,
      (isActive) => isActive && this.emit(Events.Activated),
      { fireImmediately: true },
    );
  }

  @computed
  get title() {
    return this.entity ? normalizeTitle(this.entity.metadata) : '';
  }

  @action
  async updateBody(body: unknown) {
    if (!this.entity) {
      throw new Error('not ready');
    }

    const jsonStr = JSON.stringify(body);
    this.entity.body = jsonStr;
    this.emit(Events.BodyUpdated, this.entity.body);
    this.uploadBody(jsonStr);
  }

  @action
  updateTitle(title: string) {
    if (!this.entity) {
      throw new Error('not ready');
    }

    this.entity.metadata.title = title;

    const breadcrumb = last(this.breadcrumb);

    if (breadcrumb) {
      breadcrumb.title = title;
    }

    this.emit(Events.TitleUpdated, this.entity.metadata);
    this.uploadTitle(title);
  }

  destroy() {
    super.destroy();
    this.disposeReaction();
  }

  protected async fetchEntity() {
    const [{ body: metadata }, { body }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
    ]);

    return { metadata, body };
  }

  private async loadBreadcrumb() {
    const { body: breadcrumb } = await this.remote.get<void, NotePath>(`/notes/${this.entityId}/tree-path`);

    runInAction(() => (this.breadcrumb = breadcrumb));
  }

  private readonly uploadBody = debounce((body: NoteBodyDTO) => {
    this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, body);
  }, 1000);

  private readonly uploadTitle = debounce((title: NonNullable<NoteDTO['title']>) => {
    this.remote.patch<NoteDTO>(`/notes/${this.entityId}`, { title });
  }, 1000);
}
