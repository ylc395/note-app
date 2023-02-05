import { container, singleton } from 'tsyringe';

import NoteTree from 'model/tree/NoteTree';
import { token as remoteToken } from 'infra/Remote';
import { token as userFeedbackToken } from 'infra/UserFeedback';
import { token as userInputToken } from 'infra/UserInput';
import type { NoteDTO, NoteVO as Note, NotesDTO, NoteVO } from 'interface/Note';
import type { RecyclableEntitiesDTO } from 'interface/Recyclables';

import WorkbenchService, { WorkbenchEvents } from './WorkbenchService';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(remoteToken);
  private readonly workbench = container.resolve(WorkbenchService);
  private readonly userFeedback = container.resolve(userFeedbackToken);
  private readonly userInput = container.resolve(userInputToken);
  readonly noteTree = new NoteTree();

  constructor() {
    this.workbench.on(WorkbenchEvents.NoteUpdated, this.noteTree.updateTreeByNote);
  }

  readonly createNote = async (parentId?: Note['parentId']) => {
    // fixme: knex 有个 bug，目前必须写一个字段进去 https://github.com/knex/knex/pull/5471
    let { body: note } = await this.remote.post<NoteDTO, Note>('/notes', {
      parentId: parentId || null,
    });

    if (parentId && !this.noteTree.loadedNodes.has(parentId)) {
      await this.noteTree.loadChildren(parentId);
      note = this.noteTree.getNode(note.id).note;
    } else {
      this.noteTree.updateTreeByNote(note);
    }

    this.noteTree.toggleSelect(note.id, true);
    parentId && this.noteTree.toggleExpand(parentId, true);

    this.workbench.open({ type: 'note', entity: note }, false);
  };

  readonly duplicateNote = async (targetId: Note['id']) => {
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.noteTree.updateTreeByNote(note);
    this.noteTree.toggleSelect(note.id, true);
  };

  readonly selectNote = (noteId: Note['id'], multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(noteId, !multiple);

    if (selected && !multiple) {
      const { note } = this.noteTree.getNode(noteId);
      this.workbench.open({ type: 'note', entity: note }, false);
    }
  };

  readonly deleteNotes = async (ids: Note['id'][]) => {
    await this.remote.put<RecyclableEntitiesDTO>(`/recyclables/notes`, { ids });
    this.noteTree.removeNodes(ids);
    this.userFeedback.message.success({ content: '已移至回收站' });
  };

  readonly moveNotes = async (ids: Note['id'][]) => {
    const targetId = await this.userInput.note.getNoteIdByTree();

    if (typeof targetId === 'undefined') {
      return;
    }

    const notes = ids.map((id) => ({ ...this.noteTree.getNode(id).note, parentId: targetId }));
    const { body: updatedNotes } = await this.remote.patch<NotesDTO, NoteVO[]>('/notes', notes);

    for (const note of updatedNotes) {
      this.noteTree.updateTreeByNote(note);
    }
  };
}
