import { container, singleton } from 'tsyringe';

import NoteTree from 'model/tree/NoteTree';
import { token as remoteToken } from 'infra/Remote';
import type { NoteDTO, NoteVO as Note } from 'interface/Note';

import WorkbenchService, { WorkbenchEvents } from './WorkbenchService';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(remoteToken);
  private readonly workbench = container.resolve(WorkbenchService);
  readonly noteTree = new NoteTree();

  constructor() {
    this.workbench.on(WorkbenchEvents.NoteUpdated, this.noteTree.updateTreeByNote);
  }

  readonly createNote = async (parent?: Note) => {
    // fixme: knex 有个 bug，目前必须写一个字段进去 https://github.com/knex/knex/pull/5471
    let { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { parentId: parent?.id || null });

    if (parent && !this.noteTree.loadedNodes.has(parent.id)) {
      await this.noteTree.loadChildren(parent);
      note = this.noteTree.getNote(note.id);
    } else {
      this.noteTree.updateTreeByNote(note);
    }

    this.noteTree.toggleSelect(note, true);
    parent && this.noteTree.toggleExpand(parent, true);
    this.workbench.open({ type: 'note', entity: note }, false);
  };

  readonly selectNote = (note: Note, multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(note, !multiple);

    if (selected && !multiple) {
      this.workbench.open({ type: 'note', entity: note }, false);
    }
  };
}
