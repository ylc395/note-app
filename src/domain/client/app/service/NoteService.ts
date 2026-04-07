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
import { getHash } from '#utils/file';
import type { FileDTO } from '#domain/shared/model/file';

export default class NoteService {
  constructor() {
    this.eventBus.on(
      DomainEventBus.eventNames.Created,
      (note) => void this.workbench.open({ noteId: note.id, mimeType: note.mimeType }),
    );
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly workbench = container.resolve(Workbench);

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

  public readonly createNotesWithFile = async ({
    files,
    parentId,
    onDuplicated,
    onCreated,
  }: {
    files: FileDTO[];
    parentId?: NoteVO['parentId'];
    onDuplicated: (next: () => Promise<void>, data: { duplicated: Map<FileDTO, NoteVO[]> }) => void;
    onCreated?: () => void;
  }) => {
    if (files.length === 0) {
      return;
    }

    const fileNotes = await Promise.all(
      files.map(async (file) => {
        const hash = await getHash(file.data);
        const notes = await this.remote.note.query.query({ fileHash: hash });

        return {
          file,
          notes,
        };
      }),
    );
    const duplicatedMap = new Map<FileDTO, NoteVO[]>();

    for (const { file, notes } of fileNotes) {
      if (notes.length > 0) {
        duplicatedMap.set(file, notes);
      }
    }

    const notesToCreate = files.filter((file) => !duplicatedMap.has(file));
    const upload = async () =>
      Promise.all(
        notesToCreate.map(async (file) =>
          this.createNote({
            file,
            title: file.name,
            parentId,
          }),
        ),
      ).then(onCreated);

    if (duplicatedMap.size > 0) {
      onDuplicated(upload, { duplicated: duplicatedMap });
    } else {
      upload();
    }
  };
}
