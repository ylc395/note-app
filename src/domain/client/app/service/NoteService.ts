import { compact } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { DuplicatedNoteDTO, NewNoteDTO, NotePatchDTO, NoteVO } from '#domain/shared/model/note';
import IconManager from '#domain/client/app/model/note/IconManager';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { arrayOf, type MaybeArray } from '#utils/collection';

import Workbench from '../model/Workbench';
import DomainEventBus from '../model/note/EventBus';
import BaseEditor from '../model/note/editor/BaseEditor';
import TreeExplorer from '../model/note/TreeExplorer';
import NewMaterialManager from '../model/note/NewMaterialManager';

export default class NoteService {
  constructor() {
    this.eventBus.on(
      DomainEventBus.eventNames.Created,
      (note) => void this.workbench.open({ entityId: note.id, mimeType: note.mimeType }),
    );
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly workbench = container.resolve(Workbench);

  public readonly newMaterialForm = new NewMaterialManager();

  public readonly explorer = new TreeExplorer();

  public readonly iconPicker = new IconManager({
    noteIds: () => Array.from(this.explorer.treeNodeSets.selected),
  });

  public readonly createNote = async (note: NewNoteDTO | DuplicatedNoteDTO) => {
    const newNote = await this.remote.note.create.mutate(note);
    this.eventBus.emit(DomainEventBus.eventNames.Created, newNote);
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
      return value.value.result.data;
    }

    if (Array.isArray(value)) {
      return compact(value.map((node) => (node instanceof TreeNode ? node.value : undefined)));
    }

    return undefined;
  }
}
