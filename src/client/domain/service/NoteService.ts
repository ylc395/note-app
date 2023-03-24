import { container, singleton } from 'tsyringe';
import pick from 'lodash/pick';
import EventEmitter from 'eventemitter3';

import { token as remoteToken } from 'infra/Remote';
import { token as userFeedbackToken } from 'infra/UserFeedback';
import { token as userInputToken } from 'infra/UserInput';
import type { ContextmenuItem } from 'infra/ui';

import { type NoteDTO, type NoteVO as Note, type NotesDTO, type NoteVO, normalizeTitle } from 'interface/Note';
import type { RecyclablesDTO } from 'interface/Recyclables';
import { EntityTypes } from 'interface/Entity';

import { MULTIPLE_ICON_FLAG, type NoteMetadata } from 'model/note/MetadataForm';
import NoteTree, { NoteTreeNode } from 'model/note/Tree';
import { TileSplitDirections } from 'model/workbench/TileManger';

import StarService, { StarEvents } from './StarService';
import EditorService from './EditorService';

export enum NoteEvents {
  'Deleted' = 'noteTree.deleted',
  'Updated' = 'noteTree.updated',
}

@singleton()
export default class NoteService extends EventEmitter {
  private readonly remote = container.resolve(remoteToken);
  private readonly editor = container.resolve(EditorService);
  private readonly star = container.resolve(StarService);
  private readonly userFeedback = container.resolve(userFeedbackToken);
  private readonly userInput = container.resolve(userInputToken);
  readonly noteTree = new NoteTree();

  constructor() {
    super();
    this.star.on(StarEvents.NoteAdded, (noteId) => this.noteTree.toggleStar(noteId, true));
    this.star.on(StarEvents.NoteRemoved, (noteId) => this.noteTree.toggleStar(noteId, false));
  }

  readonly createNote = async (parentId?: Note['parentId']) => {
    // fixme: knex 有个 bug，目前必须写一个字段进去 https://github.com/knex/knex/pull/5471
    let { body: note } = await this.remote.post<NoteDTO, Note>('/notes', {
      parentId: parentId || null,
    });

    if (parentId) {
      await this.noteTree.toggleExpand(parentId, true, true);
    }

    note = this.noteTree.updateTreeByNote(note).note;
    this.noteTree.toggleSelect(note.id, true);
    this.editor.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  private async duplicateNote(targetId: Note['id']) {
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.noteTree.updateTreeByNote(note);
    this.noteTree.toggleSelect(note.id, true);
  }

  readonly selectNote = (node: NoteTreeNode, multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(node.key, !multiple);

    if (selected && !multiple) {
      this.editor.openEntity({ entityType: EntityTypes.Note, entityId: node.key });
    }
  };

  private async deleteNotes(ids: Note['id'][]) {
    await this.remote.put<RecyclablesDTO>(`/recyclables/notes`, { ids });
    this.noteTree.removeNodes(ids);
    this.userFeedback.message.success({ content: '已移至回收站' });
    this.emit(NoteEvents.Deleted, ids);
  }

  readonly moveNotes = async (ids: Note['id'][], targetId?: Note['parentId']) => {
    const nodesToMove = ids.map((id) => this.noteTree.getNode(id));

    targetId = targetId === undefined ? await this.userInput.note.getMoveTargetNoteId(nodesToMove) : targetId;

    if (targetId === undefined) {
      return;
    }

    const notes = ids.map((id) => ({ id, parentId: targetId }));
    const { body: updatedNotes } = await this.remote.patch<NotesDTO, NoteVO[]>('/notes', notes);

    const targetNode = targetId ? this.noteTree.getNode(targetId, true) : undefined;

    if (targetId && !targetNode) {
      this.noteTree.removeNodes(ids);
    } else {
      for (const note of updatedNotes) {
        this.noteTree.updateTreeByNote(note, true);
      }

      this.noteTree.sort(targetNode ? targetNode.children : this.noteTree.roots, false);
    }

    this.userFeedback.message.success({
      content: `移动成功${targetId === null || targetNode?.isExpanded ? '' : '。点击定位到新位置'}`,
      onClick: async (close) => {
        close();

        if (targetId === undefined) {
          return;
        }

        await this.noteTree.toggleExpand(targetId, true, true);
        this.noteTree.toggleSelect(ids, true);
      },
    });

    this.emit(NoteEvents.Updated, updatedNotes);
  };

  private async editNotes(ids: Note['id'][]) {
    const notesToEdit = ids.map((id) => this.noteTree.getNode(id).note);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstNote = notesToEdit[0]!;
    const noteMetadata: NoteMetadata =
      notesToEdit.length > 1
        ? {
            icon: MULTIPLE_ICON_FLAG,
            isReadonly: notesToEdit.reduce((result, { isReadonly }) => {
              if (result === 2) {
                return result;
              }

              return result !== Number(isReadonly) ? 2 : (Number(isReadonly) as 0 | 1);
            }, Number(firstNote.isReadonly) as NoteMetadata['isReadonly']),
          }
        : {
            ...pick(firstNote, ['icon', 'userCreatedAt', 'userUpdatedAt', 'attributes']),
            isReadonly: Number(firstNote.isReadonly) as NoteMetadata['isReadonly'],
          };

    const updatedNoteMetadata = await this.userInput.note.editNoteMetadata(noteMetadata, {
      length: notesToEdit.length,
      title: notesToEdit.length === 1 ? normalizeTitle(firstNote) : '',
      icons: notesToEdit.map(({ icon }) => icon),
    });

    if (!updatedNoteMetadata) {
      return;
    }

    const result: NotesDTO = notesToEdit.map(({ id }) => ({
      id,
      ...updatedNoteMetadata,
      isReadonly: updatedNoteMetadata.isReadonly === 2 ? undefined : Boolean(updatedNoteMetadata.isReadonly),
      icon:
        updatedNoteMetadata.icon === MULTIPLE_ICON_FLAG
          ? undefined
          : (updatedNoteMetadata.icon as string | null | undefined),
    }));

    const { body: notes } = await this.remote.patch<NotesDTO, NoteVO[]>('/notes', result);
    const parentIds = new Set<Note['parentId']>();

    for (const note of notes) {
      this.noteTree.updateTreeByNote(note, true);
      parentIds.add(note.parentId);
    }

    for (const parentId of parentIds) {
      this.noteTree.sort(this.noteTree.getChildren(parentId), false);
    }

    this.emit(NoteEvents.Updated, notes);
  }

  readonly actByContextmenu = async (targetNode: NoteTreeNode) => {
    const { selectedNodes } = this.noteTree;
    const targetId = targetNode.key;

    if (!targetNode.isSelected) {
      this.noteTree.toggleSelect(targetId, true);
    }

    const isMultiple = selectedNodes.size > 1;
    const { focusedTile } = this.editor.tileManager;

    const description = selectedNodes.size + '项';
    const items: ContextmenuItem[] = isMultiple
      ? [
          { label: `移动${description}至...`, key: 'move' },
          { label: `收藏${description}`, key: 'star' },
          { type: 'separator' },
          { label: `批量编辑${description}属性`, key: 'edit' },
          { type: 'separator' },
          { label: `导出${description}`, key: 'export' },
          { type: 'separator' },
          { label: `删除${description}`, key: 'delete' },
        ]
      : [
          { label: '在新窗口打开', key: 'openInNewWindow', visible: Boolean(focusedTile) },
          { type: 'separator' },
          { label: '移动至...', key: 'move' },
          { label: targetNode.note.isStar ? '已收藏' : '收藏', key: 'star', disabled: targetNode.note.isStar },
          { label: '制作副本', key: 'duplicate' },
          { label: '编辑属性', key: 'edit' },
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

    const targetIds = isMultiple ? Array.from(selectedNodes).map(({ key }) => key) : [targetId];

    switch (key) {
      case 'duplicate':
        return this.duplicateNote(targetId);
      case 'delete':
        return this.deleteNotes(targetIds);
      case 'move':
        return this.moveNotes(targetIds);
      case 'edit':
        return this.editNotes(targetIds);
      case 'star':
        return this.star.starNotes(targetIds);
      case 'openInNewWindow':
        if (!focusedTile) {
          throw new Error('no focusedTile');
        }

        return this.editor.openEntity(
          { entityType: EntityTypes.Note, entityId: targetId },
          { from: focusedTile.id, direction: TileSplitDirections.Right },
        );
      default:
        break;
    }
  };
}
