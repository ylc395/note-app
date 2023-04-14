import EventEmitter from 'eventemitter3';
import { container, singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

import { token as remoteToken } from 'infra/Remote';
import { EntityTypes, type EntityLocator } from 'interface/entity';
import type { NoteBodyDTO, NoteBodyVO, NoteDTO, NoteVO } from 'interface/Note';

import NoteEditor, { Events as NoteEditorEvents, type BodyEvent, type MetadataEvent } from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/Editor';
import Tile from 'model/workbench/Tile';
import TileManager, { type TileSplitDirections } from 'model/workbench/TileManger';
import NoteService, { NoteEvents } from 'service/NoteService';

@singleton()
export default class EditorService extends EventEmitter {
  private readonly remote = container.resolve(remoteToken);
  readonly tileManager = new TileManager();
  private editors = {
    [EntityTypes.Note]: new Set<NoteEditor>(),
  };
  constructor() {
    super();
    makeObservable(this);
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

    this.editors[type].add(editor as NoteEditor);
    editor.on(EditorEvents.Destroyed, () => this.editors[type].delete(editor as NoteEditor));

    return editor;
  }

  private fetchEntity<T>({ id, type }: EntityLocator, fetch: () => Promise<T>): Promise<T> {
    const existedEditor = Array.from(this.editors[type]).find((editor) => editor.entityId === id);

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

  private createNoteEditor(tile: Tile, noteId: NoteEditor['entityId']) {
    const noteService = container.resolve(NoteService);
    const noteEditor = new NoteEditor(tile, noteId, noteService.noteTree);

    noteService.on(NoteEvents.Updated, (notes: NoteVO[]) => {
      for (const { id, ...metadata } of notes) {
        if (id === noteId) {
          noteEditor.updateMetadata(metadata, false);
        }
      }
    });

    noteEditor
      .on(
        NoteEditorEvents.BodyUpdated,
        debounce((body: BodyEvent) => this.remote.put<NoteBodyDTO>(`/notes/${noteId}/body`, body), 1000),
      )
      .on(NoteEditorEvents.BodyUpdated, (body: BodyEvent) => {
        for (const editor of this.getSameEntityEditors(noteEditor)) {
          editor.updateBody(body, false);
        }
      })
      .on(
        NoteEditorEvents.MetadataUpdated,
        debounce((note: MetadataEvent) => this.remote.patch<NoteDTO>(`/notes/${noteId}`, note), 1000),
      )
      .on(NoteEditorEvents.MetadataUpdated, (metadata: MetadataEvent) => {
        for (const editor of this.getSameEntityEditors(noteEditor)) {
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

  private getSameEntityEditors(editor: EntityEditor) {
    return Array.from(this.editors[editor.entityType]).filter((e) => e !== editor && e.entityId === editor.entityId);
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
