import { container, singleton } from 'tsyringe';

import NoteTree from 'model/tree/NoteTree';
import { token as remoteToken } from 'infra/Remote';
import { token as feedbackToken } from 'infra/Feedback';
import type { NoteDTO, NoteVO as Note, NoteQuery } from 'interface/Note';
import type { EntitiesDTO } from 'interface/Recyclables';

import WorkbenchService, { WorkbenchEvents } from './WorkbenchService';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(remoteToken);
  private readonly workbench = container.resolve(WorkbenchService);
  private readonly feedback = container.resolve(feedbackToken);
  readonly noteTree = new NoteTree();

  constructor() {
    this.workbench.on(WorkbenchEvents.NoteUpdated, this.noteTree.updateTreeByNote);
  }

  readonly loadChildren = async (note?: Note) => {
    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId: note?.id || null });
    this.noteTree.loadChildren(notes, note);
  };

  readonly createNote = async (parent?: Note) => {
    // fixme: knex 有个 bug，目前必须写一个字段进去 https://github.com/knex/knex/pull/5471
    let { body: note } = await this.remote.post<NoteDTO, Note>('/notes', {
      parentId: parent?.id || null,
    });

    if (parent && !this.noteTree.loadedNodes.has(parent.id)) {
      await this.loadChildren(parent);
      note = this.noteTree.getNode(note.id).note;
    } else {
      this.noteTree.updateTreeByNote(note);
    }

    this.noteTree.toggleSelect(note, true);
    parent && this.noteTree.toggleExpand(parent, true);

    this.workbench.open({ type: 'note', entity: note }, false);
  };

  readonly duplicateNote = async (target: Note) => {
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { duplicateFrom: target.id });

    this.noteTree.updateTreeByNote(note);
    this.noteTree.toggleSelect(note, true);
  };

  readonly selectNote = (note: Note, multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(note, !multiple);

    if (selected && !multiple) {
      this.workbench.open({ type: 'note', entity: note }, false);
    }
  };

  readonly deleteNotes = async (ids: Note['id'][]) => {
    await this.remote.put<EntitiesDTO>(`/recyclables/notes`, { ids });
    this.noteTree.removeNodes(ids);
    this.feedback.message.success({ content: '已移至回收站' });
  };
}
