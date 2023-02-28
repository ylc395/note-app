import EventEmitter from 'eventemitter3';
import { container, singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

import { token as remoteToken } from 'infra/Remote';
import { EntityTypes, type EntityId } from 'interface/Entity';
import type { NoteBodyDTO, NoteBodyVO, NoteDTO, NoteVO } from 'interface/Note';

import NoteEditor, { Events as NoteEditorEvents, type BodyEvent, type MetadataEvent } from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';
import TileManager, { TileDirections } from 'model/workbench/TileManger';
import NoteService from 'service/NoteService';

export type EntityLocator = {
  entityType: EntityTypes;
  entityId: EntityId;
};

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

  private createEditor(tile: Tile, { entityId, entityType }: EntityLocator) {
    let editor: EntityEditor;

    switch (entityType) {
      case EntityTypes.Note:
        editor = this.createNoteEditor(tile, entityId);
        break;
      default:
        throw new Error('invalid type');
    }

    this.editors[entityType].add(editor as NoteEditor);
    editor.on(EditorEvents.Destroyed, () => this.editors[entityType].delete(editor as NoteEditor));

    return editor;
  }

  private fetchEntity<T>({ entityId, entityType }: EntityLocator, fetch: () => Promise<T>): Promise<T> {
    const existedEditor = Array.from(this.editors[entityType]).find((editor) => editor.entityId === entityId);

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

    noteEditor
      .on(
        NoteEditorEvents.BodyUpdated,
        debounce((body: BodyEvent) => this.remote.put<NoteBodyDTO>(`/notes/${noteId}/body`, body), 1000),
      )
      .on(
        NoteEditorEvents.MetadataUpdated,
        debounce((note: MetadataEvent) => this.remote.patch<NoteDTO>(`/notes/${noteId}`, note), 1000),
      )
      .on(NoteEditorEvents.BodyUpdated, (body: BodyEvent) => {
        for (const editor of this.editors[EntityTypes.Note]) {
          if (editor.entityId === noteId && editor !== noteEditor) {
            editor.updateBody(body, true);
          }
        }
      })
      .on(NoteEditorEvents.MetadataUpdated, (note: MetadataEvent) => {
        for (const editor of this.editors[EntityTypes.Note]) {
          if (editor.entityId === noteId && editor !== noteEditor) {
            editor.updateMetadata(note, true);
          }
        }
      });

    this.fetchEntity({ entityType: EntityTypes.Note, entityId: noteId }, () =>
      Promise.all([
        this.remote.get<void, NoteVO>(`/notes/${noteId}`),
        this.remote.get<void, NoteBodyVO>(`/notes/${noteId}/body`),
      ]).then(([{ body: metadata }, { body }]) => ({ metadata, body })),
    ).then(noteEditor.loadEntity);

    return noteEditor;
  }

  @action.bound
  openEntity(entity: EntityLocator, newTileOptions?: { direction: TileDirections; from: Tile['id'] }) {
    if (newTileOptions) {
      const targetTile = this.tileManager.get(newTileOptions.from);
      const editor = this.createEditor(targetTile, entity);
      const newTile = this.tileManager.splitTile(targetTile.id, newTileOptions.direction);

      newTile.addEditor(editor);
    } else {
      const targetTile = this.tileManager.getTileAsTarget();

      if (
        !targetTile.switchToEditor(
          ({ entityId, entityType }) => entityType === entity.entityType && entityId === entity.entityId,
        )
      ) {
        const editor = this.createEditor(targetTile, entity);
        targetTile.addEditor(editor);
      }
    }
  }
}
