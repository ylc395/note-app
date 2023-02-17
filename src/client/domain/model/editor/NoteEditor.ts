import { makeObservable, computed, observable, runInAction, reaction } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { normalizeTitle, type NoteVO, type NoteBodyVO, type NoteBodyDTO, type NotePath, NoteDTO } from 'interface/Note';
import type Window from 'model/Window';
import NoteService, { NoteEvents } from 'service/NoteService';

import EntityEditor from './EntityEditor';

export enum Events {
  Updated = 'noteEditor.updated',
}

export default class NoteEditor extends EntityEditor {
  @observable noteBody?: NoteBodyVO;
  @observable metadata?: { note: NoteVO; breadcrumb: NotePath };
  private readonly noteService = container.resolve(NoteService);
  private readonly disposeReaction: ReturnType<typeof reaction>;

  constructor(protected readonly window: Window, readonly entityId: NoteVO['id']) {
    super(window, entityId);
    makeObservable(this);
    this.loadNoteMetadata();
    this.loadNoteBody();

    this.noteService.on(NoteEvents.Updated, this.reloadMetadata);
    this.disposeReaction = reaction(() => this.isCurrent, this.reloadMetadata);
  }

  @computed get title() {
    return this.metadata?.note ? normalizeTitle(this.metadata.note) : '';
  }

  private async loadNoteMetadata() {
    const { body: note } = await this.remote.get<void, NoteVO>(`/notes/${this.entityId}`);
    const { body: breadcrumb } = await this.remote.get<void, NotePath>(`/notes/${this.entityId}/tree-path`);

    runInAction(() => {
      this.metadata = { note, breadcrumb };
    });
  }

  private async loadNoteBody() {
    const { body: noteBody } = await this.remote.get<void, NoteBodyVO>(`/notes/${this.entityId}/body`);

    runInAction(() => {
      this.noteBody = noteBody;
    });
  }

  readonly save = debounce(async (body: unknown) => {
    const jsonStr = JSON.stringify(body);
    runInAction(() => {
      this.noteBody = jsonStr;
    });

    await this.remote.put<NoteBodyDTO>(`/notes/${this.entityId}/body`, jsonStr);
  }, 500);

  saveTitle(title: string) {
    runInAction(() => {
      if (!this.metadata) {
        throw new Error('not ready');
      }

      this.metadata.note.title = title;

      const breadcrumb = this.metadata.breadcrumb.find(({ id }) => id === this.entityId);

      if (!breadcrumb) {
        throw new Error('no breadcrumb');
      }

      breadcrumb.title = title;
    });

    this.syncTitle(title);
  }

  private readonly syncTitle = debounce(async (title: string) => {
    if (!this.metadata) {
      throw new Error('no ready');
    }

    const { body: note } = await this.remote.patch<NoteDTO, NoteVO>(`/notes/${this.entityId}`, { title });
    this.emit(Events.Updated, note);
  }, 500);

  private readonly reloadMetadata = () => {
    if (this.isCurrent) {
      this.loadNoteMetadata();
    }
  };

  destroy() {
    super.destroy();
    this.noteService.off(NoteEvents.Updated, this.reloadMetadata);
    this.disposeReaction();
  }
}
