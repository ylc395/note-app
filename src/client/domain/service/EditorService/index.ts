import EventEmitter from 'eventemitter2';
import { container, singleton } from 'tsyringe';
import { action, makeObservable } from 'mobx';
import debounce from 'lodash/debounce';

import { token as remoteToken } from 'infra/Remote';
import { EntityTypes } from 'interface/Entity';
import type { NoteBodyDTO, NoteBodyVO, NoteDTO, NoteVO } from 'interface/Note';

import NoteEditor, { Events as NoteEditorEvents } from 'model/note/Editor';
import EntityEditor, { Events as EditorEvents } from 'model/abstract/Editor';
import type Tile from 'model/workbench/Tile';
import TileManager, { TileDirections } from 'model/workbench/TileManger';
import NoteService from 'service/NoteService';

import EntityManager, { EntityLocator } from './EntityManager';

@singleton()
export default class EditorService extends EventEmitter {
  private readonly remote = container.resolve(remoteToken);
  readonly tileManager = new TileManager();
  private readonly entityManager = new EntityManager();
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

    editor.onAny((e, value) => this.emit(e, value));
    editor.on(EditorEvents.Destroyed, () => {
      this.entityManager.reduceReference({ entityId, entityType });
    });

    return editor;
  }

  private createNoteEditor(tile: Tile, noteId: NoteEditor['entityId']) {
    const noteService = container.resolve(NoteService);
    const noteEditor = new NoteEditor(tile, noteId, noteService.noteTree);

    this.entityManager
      .get({ entityId: noteId, entityType: EntityTypes.Note }, async () => {
        const [{ body: metadata }, { body }] = await Promise.all([
          this.remote.get<void, NoteVO>(`/notes/${noteId}`),
          this.remote.get<void, NoteBodyVO>(`/notes/${noteId}/body`),
        ]);

        return { body, metadata };
      })
      .then(noteEditor.loadEntity);

    noteEditor.on(
      NoteEditorEvents.BodyUpdated,
      debounce((body: string) => this.remote.put<NoteBodyDTO>(`/notes/${noteId}/body`, body), 1000),
    );

    noteEditor.on(
      NoteEditorEvents.MetadataUpdated,
      debounce((note: NoteVO) => this.remote.patch<NoteDTO>(`/notes/${noteId}`, note), 1000),
    );

    return noteEditor;
  }

  @action.bound
  openEntity(entity: EntityLocator, type?: 'newTab' | 'newWindow') {
    const targetTile = this.tileManager.getTileAsTarget();

    if (!type) {
      if (
        !targetTile.switchToEditor(
          ({ entityId, entityType }) => entityType === entity.entityType && entityId === entity.entityId,
        )
      ) {
        const editor = this.createEditor(targetTile, entity);
        targetTile.addEditor(editor);
      }

      return;
    }

    const editor = this.createEditor(targetTile, entity);

    if (type === 'newWindow') {
      if (targetTile.isRoot && targetTile.editors.length === 0) {
        targetTile.addEditor(editor);
      } else {
        const newTile = this.tileManager.splitTile(targetTile.id, TileDirections.Horizontal);
        newTile.addEditor(editor);
      }
    } else if (type === 'newTab') {
      targetTile.addEditor(editor);
    }
  }

  @action.bound
  duplicateOnNewTile(tileId: Tile['id'], direction: TileDirections) {
    const fromTile = this.tileManager.get(tileId);

    if (!fromTile.currentEditor) {
      throw new Error('no current tab');
    }

    const { entityId, entityType } = fromTile.currentEditor;
    const newTile = this.tileManager.splitTile(tileId, direction);
    const editor = this.createEditor(newTile, { entityId, entityType });

    newTile.addEditor(editor);
  }
}
