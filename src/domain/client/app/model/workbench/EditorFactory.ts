import type Tile from './Tile';
import Editor, { Options as EditorOptions } from './BaseEditor';
import { EntityId, EntityTypes } from '#domain/shared/model/entity';
import assert from 'assert';

export interface EditorDTO<T = unknown> extends EditorOptions<T> {
  mimeType: string | null;
  entityType: EntityTypes;
}

export type Factory<T = unknown> = (editor: EditorDTO, tile: Tile) => Editor<T>;

export default class EditorFactory {
  private readonly editorsMap = new Map<Editor['id'], Editor>();

  private readonly entityEditorMap = new Map<EntityId, Editor[]>();

  public create(tile: Tile, config: EditorDTO) {
    const factory = EditorFactory.factories.get(config.entityType);
    assert(factory);

    const editor = factory(config, tile);
    const entityEditors = this.entityEditorMap.get(config.entityId) || [];
    entityEditors.push(editor);
    this.entityEditorMap.set(config.entityId, entityEditors);
    this.editorsMap.set(editor.id, editor);

    editor.events.on(Editor.eventNames.Destroy, this.handleEditorDestroyed.bind(this));

    return editor;
  }

  private handleEditorDestroyed(editor: Editor) {
    this.editorsMap.delete(editor.id);
  }

  public get(id: Editor['id']) {
    return this.editorsMap.get(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static readonly factories = new Map<EntityTypes, Factory<any>>();

  public static registryFactory<T>(type: EntityTypes, factory: Factory<T>) {
    EditorFactory.factories.set(type, factory);
  }
}
