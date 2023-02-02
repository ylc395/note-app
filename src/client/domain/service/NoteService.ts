import { container, singleton } from 'tsyringe';

import NoteTree from 'model/tree/NoteTree';
import { type Remote, token as remoteToken } from 'infra/Remote';
import type { NoteDTO, NoteVO } from 'interface/Note';

import WorkbenchService, { WorkbenchEvents } from './WorkbenchService';

@singleton()
export default class NoteService {
  private readonly remote: Remote = container.resolve(remoteToken);
  private readonly workbench = container.resolve(WorkbenchService);
  readonly noteTree = new NoteTree();

  constructor() {
    this.workbench.on(WorkbenchEvents.NoteUpdated, this.noteTree.updateTreeByNote);
  }

  readonly createNote = async () => {
    // fixme: knex 有个 bug，目前必须写一个字段进去 https://github.com/knex/knex/pull/5471
    const { body: note } = await this.remote.post<NoteDTO, NoteVO>('/notes', { title: '' });

    this.noteTree.updateTreeByNote(note);
    this.noteTree.toggleSelect(note.id, true);
    this.workbench.open({ type: 'note', entity: note }, false);
  };

  readonly selectNote = (id: string, multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(id, !multiple);

    if (selected && !multiple) {
      const note = this.noteTree.getNote(id);
      this.workbench.open({ type: 'note', entity: note }, false);
    }
  };
}
