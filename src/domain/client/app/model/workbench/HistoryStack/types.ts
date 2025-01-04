import type { EntityLocator } from '#domain/client/shared/model/entity';
import type Editor from '#domain/client/app/model/note/editor/BaseEditor';
import type Tile from '../Tile';

export interface Record extends EntityLocator {
  tileId: Tile['id'];
  editorId: Editor['id'];
}

export enum Direction {
  BACKWARD,
  FORWARD,
}
