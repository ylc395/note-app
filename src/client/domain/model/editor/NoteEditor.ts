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
  breadcrumb: NotePath;
}

export default class NoteEditor extends EntityEditor<Entity> {
  private disposeReaction?: ReturnType<typeof reaction>;
  readonly entityType: EntityTypes = EntityTypes.Note;
  constructor(window: Window, noteId: NoteVO['id']) {
    super(window, noteId);
    makeObservable(this);
    this.init();
  }

  protected async init() {
    this.disposeReaction = reaction(
      () => this.isActive,
      (isActive) => isActive && this.emit(Events.Activated),
      { fireImmediately: true },
    );
    super.init();
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

    const breadcrumb = last(this.entity.breadcrumb);

    if (!breadcrumb) {
      throw new Error('no breadcrumb');
    }

    breadcrumb.title = title;
    this.emit(Events.TitleUpdated, this.entity.metadata);
    this.uploadTitle(title);
  }

  destroy() {
    super.destroy();
    this.disposeReaction && this.disposeReaction();
  }

  protected async fetchEntity() {
    const [{ body: metadata }, { body }, { body: breadcrumb }] = await Promise.all([
      this.remote.get<void, NoteVO>(`/notes/${this.entityId}`),
      this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`),
      this.remote.get<void, NotePath>(`/notes/${this.entityId}/tree-path`),
    ]);

    return { metadata, body, breadcrumb };
  }

  private readonly uploadBody = debounce((body: NoteBodyDTO) => {
    this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, body);
  }, 1000);

  private readonly uploadTitle = debounce((title: NonNullable<NoteDTO['title']>) => {
    this.remote.patch<NoteDTO>(`/notes/${this.entityId}`, { title });
  }, 1000);
}
