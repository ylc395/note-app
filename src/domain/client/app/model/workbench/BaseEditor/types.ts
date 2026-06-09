import type Tile from '../Tile';
import type Editor from '.';
import type { Options as EditorOptions } from '.';
import type { EntityTypes } from '#domain/shared/model/entity';

export interface EditorDTO<T = unknown> extends EditorOptions<T> {
  mimeType: string | null;
  entityType: EntityTypes;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Factory<T = any> = (editor: EditorDTO<T>, tile: Tile) => Editor<T>;
