import { container, singleton } from 'tsyringe';

import NoteTree from 'model/tree/NoteTree';
import { token as remoteToken } from 'infra/Remote';
import { token as userFeedbackToken } from 'infra/UserFeedback';
import { token as userInputToken } from 'infra/UserInput';
import type { ContextmenuItem } from 'infra/ui';
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

    if (parentId) {
      await this.noteTree.toggleExpand(parentId, true, true);
    }

    note = this.noteTree.updateTreeByNote(note)?.note;
    this.noteTree.toggleSelect(note.id, true);
    this.workbench.open({ type: 'note', entity: note }, false);
  };

  private async duplicateNote(targetId: Note['id']) {
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.noteTree.updateTreeByNote(note);
    this.noteTree.toggleSelect(note.id, true);
  }

  readonly selectNote = (noteId: Note['id'], multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(noteId, !multiple);

    if (selected && !multiple) {
      const { note } = this.noteTree.getNode(noteId);
      this.workbench.open({ type: 'note', entity: note }, false);
    }
  };

  private async deleteNotes(ids: Note['id'][]) {
    await this.remote.put<RecyclableEntitiesDTO>(`/recyclables/notes`, { ids });
    this.noteTree.removeNodes(ids);
    this.userFeedback.message.success({ content: '已移至回收站' });
  }

  private async moveNotes(ids: Note['id'][]) {
    const targetId = await this.userInput.note.getNoteIdByTree(ids.map((id) => this.noteTree.getNode(id)));

    if (typeof targetId === 'undefined') {
      return;
    }

    const notes = ids.map((id) => ({ ...this.noteTree.getNode(id).note, parentId: targetId }));
    const { body: updatedNotes } = await this.remote.patch<NotesDTO, NoteVO[]>('/notes', notes);

    this.userFeedback.message.success({
      content: `移动成功${!targetId || this.noteTree.expandedNodes.has(targetId) ? '' : '。点击定位到新位置'}`,
      onClick: async () => {
        await this.noteTree.toggleExpand(targetId, true, true);
        this.noteTree.toggleSelect(ids, true);
      },
    });

    const targetNode = targetId && this.noteTree.getNode(targetId, true);

    if (targetId && !targetNode) {
      this.noteTree.removeNodes(ids);
    } else {
      for (const note of updatedNotes) {
        this.noteTree.updateTreeByNote(note, true);
      }

      this.noteTree.sort(targetNode ? targetNode.children : this.noteTree.roots, false);
    }
  }

  readonly actByContextmenu = async (targetId: Note['id']) => {
    const { selectedNodes } = this.noteTree;

    if (!selectedNodes.has(targetId)) {
      this.noteTree.toggleSelect(targetId, true);
    }

    const isMultiple = selectedNodes.size > 1 && selectedNodes.has(targetId);
    const noteIds = isMultiple ? Array.from(selectedNodes) : [targetId];

    const description = noteIds.length + '项';
    const items: ContextmenuItem[] = isMultiple
      ? [
          { label: `移动${description}至...`, key: 'move' },
          { label: `收藏${description}`, key: 'star' },
          { type: 'separator' },
          { label: `导出${description}`, key: 'export' },
          { type: 'separator' },
          { label: `删除${description}`, key: 'delete' },
        ]
      : [
          { label: '在新标签页打开', key: 'delete' },
          { label: '在新窗口打开', key: 'delete' },
          { type: 'separator' },
          { label: '移动至...', key: 'move' },
          { label: '收藏', key: 'star' },
          { label: '制作副本', key: 'duplicate' },
          { type: 'separator' },
          { label: '使用外部应用打开', key: 'external' },
          { label: '导出', key: 'export' },
          { type: 'separator' },
          { label: '删除', key: 'delete' },
        ];

    const key = await this.userInput.common.getContextmenuAction(items);

    if (!key) {
      return;
    }

    const targets = isMultiple ? Array.from(selectedNodes) : [targetId];

    switch (key) {
      case 'duplicate':
        return this.duplicateNote(targetId);
      case 'delete':
        return this.deleteNotes(targets);
      case 'move':
        return this.moveNotes(targets);
      default:
        break;
    }
  };
}
