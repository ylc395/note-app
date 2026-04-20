import { compact } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { DuplicatedNoteDTO, NewNoteDTO, NotePatchDTO, NoteVO } from '#domain/shared/model/note';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { arrayOf, type MaybeArray } from '#utils/collection';
import { EntityTypes } from '#domain/shared/model/entity';

import DomainEventBus from '../model/note/EventBus';
import BaseEditor from '../model/note/editor/BaseEditor';
import factory from '../model/note/editor/factory';

import Workbench from '../model/Workbench';
import EditorFactory from '../model/Workbench/EditorFactory';

export default class NoteService {
  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly createNote = async (note: NewNoteDTO | DuplicatedNoteDTO, open?: boolean) => {
    const newNote = await this.remote.note.create.mutate(note);
    this.eventBus.emit(DomainEventBus.eventNames.Created, newNote);

    if (open) {
      const workbench = container.resolve(Workbench);
      workbench.open({
        entityId: newNote.id,
        entityType: EntityTypes.Note,
        mimeType: newNote.mimeType,
      });
    }
  };

  public readonly updateNote = async (notes: MaybeArray<NoteVO | NoteVO['id']>, patch: NotePatchDTO) => {
    notes = arrayOf(notes);
    const ids = notes.map((note) => (typeof note === 'string' ? note : note.id));
    await this.remote.note.batchUpdate.mutate([ids, patch]);

    for (const id of ids) {
      this.eventBus.emit(DomainEventBus.eventNames.Updated, { id, payload: patch });
    }
  };

  public static getNote(value: unknown) {
    if (value instanceof TreeNode) {
      return value.value;
    }

    if (value instanceof BaseEditor) {
      return value.value.data;
    }

    if (Array.isArray(value)) {
      return compact(value.map((node) => (node instanceof TreeNode ? node.value : undefined)));
    }

    return undefined;
  }

  public static boot() {
    EditorFactory.registryFactory(EntityTypes.Note, factory);
  }
}
