import type Editor from '../../note/editor/BaseEditor';
import type { Direction } from '../HistoryStack';

export enum EventNames {
  Destroyed = 'destroyed',
  EditorSwitched = 'editorSwitched',
}

export type Events = {
  [EventNames.Destroyed]: undefined;
  [EventNames.EditorSwitched]: { editor: Editor | null; fromHistory?: Direction };
};
