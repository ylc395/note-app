import type { EntityId } from '#domain/shared/model/entity';
import type Editor from '#domain/client/app/model/note/editor/BaseEditor';
import type Tile from '../Tile';

export interface Record {
  entityId: EntityId;
  tileId: Tile['id'];
  editorId: Editor['id'];
  mimeType: string | null;
}

export enum Direction {
  BACKWARD,
  FORWARD,
}
