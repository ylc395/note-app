import type Editor from '../../abstract/Editor';
import type { Direction } from '../Workbench/HistoryStack';

export enum EventNames {
  Destroyed = 'destroyed',
  EditorSwitched = 'editorSwitched',
}

export type Events = {
  [EventNames.Destroyed]: undefined;
  [EventNames.EditorSwitched]: { to: Editor | null; fromHistory?: Direction };
};
