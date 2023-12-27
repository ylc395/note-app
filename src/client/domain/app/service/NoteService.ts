import { container, singleton } from 'tsyringe';
import assert from 'assert';
import { compact } from 'lodash-es';

import { token as remoteToken } from '@domain/common/infra/remote';
import { token as UIToken } from '@domain/app/infra/ui';

import type { NotesPatchDTO, NoteVO, NotePatchDTO } from '@shared/domain/model/note';
import { MULTIPLE_ICON_FLAG, type NoteMetadata } from '@domain/app/model/note/MetadataForm';
import { Workbench } from '@domain/app/model/workbench';
import EditableEntityManager from '@domain/app/model/manager/EditableEntityManager';
import NoteEditor from '@domain/app/model/note/Editor';
import NoteExplorer from '@domain/app/model/note/Explorer';
import type { RecyclablesDTO } from '@shared/domain/model/recyclables';
import { EntityParentId, EntityTypes } from '@shared/domain/model/entity';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import NoteTree from '@domain/common/model/note/Tree';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(remoteToken);
  private readonly ui = container.resolve(UIToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);
  private readonly editableEntityManager = container.resolve(EditableEntityManager);

  private get tree() {
    return this.explorer.tree;
  }

  readonly createNote = async (parentId?: NoteVO['parentId']) => {
    const { body: note } = await this.remote.post<NotePatchDTO, NoteVO>('/notes', {
      parentId: parentId || null,
    });

    this.tree.updateTree(note);

    if (parentId) {
      this.tree.toggleExpand(parentId, true);
    }

    this.tree.toggleSelect(note.id);
    this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  readonly duplicateNote = async (targetId?: NoteVO['id']) => {
    const fromId = targetId || this.tree.selectedNodes[0]?.id;
    assert(typeof fromId === 'string');

    const { body: note } = await this.remote.post<void, NoteVO>(`/notes?from=${fromId}`);

    this.tree.updateTree(note);
    this.tree.toggleSelect(note.id);
  };

  async deleteNotes(ids: NoteVO['id'][]) {
    const locators = ids.map((id) => ({ entityId: id, entityType: EntityTypes.Note } as const));
    await this.remote.patch<RecyclablesDTO>(`/recyclables`, locators);
    this.tree.removeNodes(ids);
    this.ui.feedback({ type: 'success', content: '已移至回收站' });
  }

  public readonly getNoteIds = (item: unknown) => {
    if (item instanceof TreeNode && item.tree === this.tree) {
      return item.tree.selectedNodes.map(({ id }) => id);
    }

    if (item instanceof NoteEditor) {
      return [item.entityLocator.entityId];
    }

    if (item instanceof NoteTree) {
      return item.selectedNodes.map(({ id }) => id);
    }
  };

  public readonly moveNotes = async (targetId: NoteVO['parentId'], item: unknown) => {
    const ids = item ? this.getNoteIds(item) : compact(this.tree.selectedNodes.map(({ id }) => id));

    if (!ids) {
      return;
    }

    await this.remote.patch<NotesPatchDTO>('/notes', {
      ids,
      note: { parentId: targetId },
    });

    for (const id of ids) {
      const entity = this.tree.getNode(id).entity;
      assert(entity);

      this.tree.updateNode({ ...entity, parentId: targetId });
      this.editableEntityManager.refresh(id);
    }

    if (targetId) {
      this.tree.toggleExpand(targetId, true);
    }

    this.tree.setSelected(ids);
  };

  public async editNotes(metadata: NoteMetadata) {
    const { body: notes } = await this.remote.patch<NotesPatchDTO, NoteVO[]>('/notes', {
      ids: compact(this.tree.selectedNodes.map(({ id }) => id)),
      note: {
        ...metadata,
        isReadonly: metadata.isReadonly === 2 ? undefined : Boolean(metadata.isReadonly),
        icon: metadata.icon === MULTIPLE_ICON_FLAG ? undefined : (metadata.icon as string | null | undefined),
      },
    });

    this.tree.updateTree(notes);
  }
}
