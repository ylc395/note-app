import { makeObservable, computed, observable, runInAction, reaction } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { normalizeTitle, type NoteVO, type NoteBodyVO, type NoteBodyDTO, type NotePath, NoteDTO } from 'interface/Note';
import type Window from 'model/windowManager/Window';
import NoteService, { NoteEvents } from 'service/NoteService';

import EntityEditor from './EntityEditor';

export enum Events {
  Updated = 'noteEditor.updated',
}

interface NoteEditorEntity {
  body?: NoteBodyVO;
  metadata?: NoteVO;
  breadcrumb?: NotePath;
}

export default class NoteEditor extends EntityEditor<NoteEditorEntity> {
  private readonly noteService = container.resolve(NoteService);
  private readonly disposeReaction: ReturnType<typeof reaction>;

  @observable entity: NoteEditorEntity = {};

  constructor(protected readonly window: Window, readonly entityId: NoteVO['id']) {
    super(window, entityId);
    makeObservable(this);

    this.loadEntity();
    this.noteService.on(NoteEvents.Updated, this.reloadMetadata);
    this.disposeReaction = reaction(() => this.isActive, this.reloadMetadata);
  }

  @computed get title() {
    return this.entity.metadata ? normalizeTitle(this.entity.metadata) : '';
  }

  protected async loadEntity() {
    await Promise.all([this.loadNoteBody(), this.loadNoteMetadata()]);
  }

  private async loadNoteMetadata() {
    const { body: note } = await this.remote.get<void, NoteVO>(`/notes/${this.entityId}`);
    const { body: breadcrumb } = await this.remote.get<void, NotePath>(`/notes/${this.entityId}/tree-path`);

    runInAction(() => {
      this.entity.metadata = note;
      this.entity.breadcrumb = breadcrumb;
    });
  }

  private async loadNoteBody() {
    const { body: noteBody } = await this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`);

    runInAction(() => {
      this.entity.body = noteBody;
    });
  }

  readonly save = debounce(async (body: unknown) => {
    const jsonStr = JSON.stringify(body);
    runInAction(() => {
      this.entity.body = jsonStr;
    });

    await this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, jsonStr);
  }, 500);

  saveTitle(title: string) {
    runInAction(() => {
      if (!this.entity.metadata) {
        throw new Error('not ready');
      }

      this.entity.metadata.title = title;

      const breadcrumb = this.entity.breadcrumb?.find(({ id }) => id === this.entityId);

      if (breadcrumb) {
        breadcrumb.title = title;
      }
    });

    this.syncTitle(title);
  }

  private readonly syncTitle = debounce(async (title: string) => {
    if (!this.entity.metadata) {
      throw new Error('no ready');
    }

    const { body: note } = await this.remote.patch<NoteDTO, NoteVO>(`/notes/${this.entityId}`, { title });
    this.emit(Events.Updated, note);
  }, 500);

  private readonly reloadMetadata = () => {
    if (this.isActive) {
      this.loadNoteMetadata();
    }
  };

  destroy() {
    super.destroy();
    this.noteService.off(NoteEvents.Updated, this.reloadMetadata);
    this.disposeReaction();
  }
}
