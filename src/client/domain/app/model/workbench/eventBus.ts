import EventBus from '@domain/app/infra/EventBus';
import type { default as Tile, SwitchReasons } from './Tile';
import Editor from '../abstract/Editor';

export enum EventNames {
  TileEmptied = 'tile.emptied',
  EditorSwitched = 'editor.switched',
  EditorDestroyed = 'editor.destroyed',
}

export const eventBus = new EventBus<{
  [EventNames.TileEmptied]: Tile;
  [EventNames.EditorSwitched]: [Editor | undefined, SwitchReasons | undefined];
  [EventNames.EditorDestroyed]: Editor;
}>('workbench');
