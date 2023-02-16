import { makeObservable, computed, observable, runInAction, reaction } from 'mobx';
import debounce from 'lodash/debounce';
import { container } from 'tsyringe';

import { normalizeTitle, type NoteVO, type NoteBodyVO, type NoteBodyDTO, type NotePath } from 'interface/Note';
import type Window from 'model/Window';

import EntityEditor from './EntityEditor';
import NoteService, { NoteEvents } from 'service/NoteService';

export default class NoteEditor extends EntityEditor {
  @observable note?: NoteVO;
  @observable noteBody?: NoteBodyVO;
  @observable breadcrumb?: NotePath;
  private readonly noteService = container.resolve(NoteService);
  private readonly disposeReaction: ReturnType<typeof reaction>;

  constructor(protected readonly window: Window, readonly entityId: NoteVO['id']) {
    super(window, entityId);
    makeObservable(this);
    this.loadNoteMetadata();
    this.loadNoteBody();

    this.noteService.on(NoteEvents.Updated, this.reloadMetadata);
    this.disposeReaction = reaction(() => this.isVisible, this.reloadMetadata);
  }

  @computed get title() {
    if (!this.note) {
      return '';
    }

    return normalizeTitle(this.note);
  }

  private async loadNoteMetadata() {
    const { body: note } = await this.remote.get<void, NoteVO>(`/notes/${this.entityId}`);
    const { body: notePath } = await this.remote.get<void, NotePath>(`/notes/${this.entityId}/tree-path`);

    runInAction(() => {
      this.note = note;
      this.breadcrumb = notePath;
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
      if (!this.note) {
        throw new Error('no note');
      }
      this.note.title = title;
    });

    this.syncTitle(title);
  }

  private readonly syncTitle = debounce(async (title: string) => {
    this.window.notifyEntityUpdated(this);
    await this.remote.patch(`/notes/${this.entityId}`, { title });
  }, 500);

  private readonly reloadMetadata = () => {
    if (this.isVisible) {
      this.loadNoteMetadata();
    }
  };

  destroy() {
    this.noteService.off(NoteEvents.Updated, this.reloadMetadata);
    this.disposeReaction();
  }
}
