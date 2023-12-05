import { container, singleton } from 'tsyringe';
import assert from 'assert';
import compact from 'lodash/compact';

import { token as remoteToken } from '@domain/infra/remote';
import { token as UIToken } from '@domain/infra/ui';

import type { NotesPatchDTO as NotesPatch, NoteVO as Note, NotePatchDTO as NotePatch } from '@domain/model/note';
import type { RecyclablesDTO } from '@domain/model/recyclables';
import { EntityTypes } from '@domain/model/entity';
import Explorer from '@domain/model/Explorer';
import type { SelectEvent } from '@domain/model/abstract/Tree';
import { MULTIPLE_ICON_FLAG, type NoteMetadata } from '@domain/model/note/MetadataForm';
import { EditableEntityManager, Workbench } from '@domain/model/workbench';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(remoteToken);
  private readonly ui = container.resolve(UIToken);
  private readonly explorer = container.resolve(Explorer);
  private readonly workbench = container.resolve(Workbench);
  private readonly editableEntityManager = container.resolve(EditableEntityManager);

  private get tree() {
    return this.explorer.noteTree;
  }

  constructor() {
    this.tree.on('nodeSelected', this.handleSelect);
  }

  readonly createNote = async (parentId?: Note['parentId']) => {
    const { body: note } = await this.remote.post<NotePatch, Note>('/notes', {
      parentId: parentId || null,
    });

    this.tree.updateTree(note);

    if (parentId) {
      this.tree.toggleExpand(parentId, true);
    }

    this.tree.toggleSelect(note.id);
    this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  readonly duplicateNote = async (targetId?: Note['id']) => {
    const fromId = targetId || this.tree.getSelectedId();
    assert(typeof fromId === 'string');

    const { body: note } = await this.remote.post<void, Note>(`/notes?from=${fromId}`);

    this.tree.updateTree(note);
    this.tree.toggleSelect(note.id);
  };

  private readonly handleSelect = ({ id, multiple, reason }: SelectEvent) => {
    assert(id);
    if (!multiple && (!reason || !['drag', 'contextmenu'].includes(reason))) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: id });
    }
  };

  async deleteNotes(ids: Note['id'][]) {
    const locators = ids.map((id) => ({ entityId: id, entityType: EntityTypes.Note } as const));
    await this.remote.patch<RecyclablesDTO>(`/recyclables`, locators);
    this.tree.removeNodes(ids);
    this.ui.feedback({ type: 'success', content: '已移至回收站' });
  }

  readonly moveNotes = async (targetId: Note['parentId'], ids?: Note['id'][]) => {
    const _ids = ids || compact(this.tree.selectedNodeIds);

    await this.remote.patch<NotesPatch>('/notes', {
      ids: _ids,
      note: { parentId: targetId },
    });

    for (const id of _ids) {
      this.editableEntityManager.refresh(id);
      this.tree.updateNode({ id, parentId: targetId });
    }

    if (targetId) {
      this.tree.toggleExpand(targetId, true);
    }

    this.tree.setSelected(_ids);
  };

  async editNotes(metadata: NoteMetadata) {
    const { body: notes } = await this.remote.patch<NotesPatch, Note[]>('/notes', {
      ids: compact(this.tree.selectedNodeIds),
      note: {
        ...metadata,
        isReadonly: metadata.isReadonly === 2 ? undefined : Boolean(metadata.isReadonly),
        icon: metadata.icon === MULTIPLE_ICON_FLAG ? undefined : (metadata.icon as string | null | undefined),
      },
    });

    this.tree.updateTree(notes);
  }
}
