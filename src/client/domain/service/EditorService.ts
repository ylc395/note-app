import { container, singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

import { token as remoteToken } from 'infra/Remote';
import { EntityTypes, type EntityLocator } from 'interface/entity';
import type { NoteBodyDTO, NoteBodyVO, NoteDTO, NoteVO } from 'interface/Note';

import NoteEditor, { Events as NoteEditorEvents } from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/Editor';
import Tile from 'model/workbench/Tile';
import TileManager, { type TileSplitDirections } from 'model/workbench/TileManger';
import NoteService, { NoteEvents } from 'service/NoteService';

@singleton()
export default class EditorService {
  private readonly remote = container.resolve(remoteToken);
  readonly tileManager = new TileManager();
  private editors: { [key in EntityTypes]?: Set<EntityEditor> } = {
    [EntityTypes.Note]: new Set<NoteEditor>(),
  };

  constructor() {
    makeObservable(this);
    this.init();
  }

  private init() {
    const noteService = container.resolve(NoteService);

    noteService.on(NoteEvents.Updated, (notes) => {
      for (const note of notes) {
        const editors = this.getEditorsByEntity<NoteEditor>({ type: EntityTypes.Note, id: note.id });

        for (const editor of editors) {
          editor.updateMetadata(note, false);
        }
      }
    });
  }

  private createEditor(tile: Tile, { id, type }: EntityLocator) {
    let editor: EntityEditor;

    switch (type) {
      case EntityTypes.Note:
        editor = this.createNoteEditor(tile, id);
        break;
      default:
        throw new Error('invalid type');
    }

    const editorSet = this.editors[type];

    if (!editorSet) {
      throw new Error('invalid type');
    }

    editorSet.add(editor);
    editor.once(EditorEvents.Destroyed, () => editorSet.delete(editor as NoteEditor));

    return editor;
  }

  private fetchEntity<T>(entity: EntityLocator, fetch: () => Promise<T>): Promise<T> {
    const existedEditor = this.getEditorsByEntity(entity)[0];

    return new Promise((resolve) => {
      if (existedEditor) {
        if (existedEditor.entity) {
          resolve(cloneDeep(existedEditor.entity as T));
        } else {
          existedEditor.once(EditorEvents.Loaded, (entity: T) => resolve(cloneDeep(entity)));
        }
      } else {
        fetch().then(resolve);
      }
    });
  }

  //todo: bind ctrl+S
  saveNote(noteId: NoteVO['id'], body: string, isImportant?: true) {
    return this.remote.put<NoteBodyDTO>(`/notes/${noteId}/body`, { content: body, isImportant });
  }

  private createNoteEditor(tile: Tile, noteId: NoteEditor['entityId']) {
    const noteService = container.resolve(NoteService);
    const noteEditor = new NoteEditor(tile, noteId, noteService.noteTree);
    const entity = { type: EntityTypes.Note, id: noteId };

    noteEditor
      .on(NoteEditorEvents.BodyUpdated, debounce(this.saveNote.bind(this, noteId), 1000))
      .on(NoteEditorEvents.BodyUpdated, (body) => {
        for (const editor of this.getEditorsByEntity<NoteEditor>(entity, noteEditor.id)) {
          editor.updateBody(body, false);
        }
      })
      .on(
        NoteEditorEvents.Updated,
        debounce((note) => this.remote.patch<NoteDTO>(`/notes/${noteId}`, note), 1000),
      )
      .on(NoteEditorEvents.Updated, (metadata) => {
        for (const editor of this.getEditorsByEntity<NoteEditor>(entity, noteEditor.id)) {
          editor.updateMetadata(metadata, false);
        }
      });

    this.fetchEntity({ type: EntityTypes.Note, id: noteId }, () =>
      Promise.all([
        this.remote.get<void, NoteVO>(`/notes/${noteId}`),
        this.remote.get<void, NoteBodyVO>(`/notes/${noteId}/body`),
      ]).then(([{ body: metadata }, { body }]) => ({ metadata, body })),
    ).then(noteEditor.loadEntity);

    return noteEditor;
  }

  private getEditorsByEntity<T extends EntityEditor>({ id, type }: EntityLocator, excludeId?: EntityEditor['id']) {
    const editorSet = this.editors[type];

    if (!editorSet) {
      throw new Error('unsupported type');
    }

    return Array.from(editorSet).filter((e) => e.entityId === id && (excludeId ? excludeId !== e.id : true)) as T[];
  }

  @action.bound
  openEntity(entity: EntityLocator, newTileOptions?: { direction: TileSplitDirections; from: Tile }) {
    if (newTileOptions) {
      const newTile = this.tileManager.splitTile(newTileOptions.from.id, newTileOptions.direction);
      const editor = this.createEditor(newTile, entity);

      newTile.addEditor(editor);
    } else {
      const targetTile = this.tileManager.getTileAsTarget();

      if (
        !targetTile.switchToEditor(({ entityId, entityType }) => entityType === entity.type && entityId === entity.id)
      ) {
        const editor = this.createEditor(targetTile, entity);
        targetTile.addEditor(editor);
      }
    }
  }

  @action.bound
  moveEditor(srcEditor: EntityEditor, dest: EntityEditor | Tile | { from: Tile; splitDirection: TileSplitDirections }) {
    if (dest instanceof Tile) {
      if (srcEditor.tile === dest) {
        srcEditor.tile.moveEditor(srcEditor, 'end');
      } else {
        srcEditor.tile.removeEditor(srcEditor.id, false);
        dest.addEditor(srcEditor);
      }
      return;
    } else if (dest instanceof EntityEditor) {
      if (srcEditor.tile === dest.tile) {
        dest.tile.moveEditor(srcEditor, dest);
      } else {
        srcEditor.tile.removeEditor(srcEditor.id, false);
        dest.tile.addEditor(srcEditor, dest);
      }
    } else {
      const { from, splitDirection } = dest;
      const newTile = this.tileManager.splitTile(from.id, splitDirection);
      from.removeEditor(srcEditor.id, false);
      newTile.addEditor(srcEditor);
    }
  }
}
