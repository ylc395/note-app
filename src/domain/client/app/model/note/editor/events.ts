import type { Direction } from '../../base/HistoryStack';
import type BaseEditor from './BaseEditor';

export enum EventNames {
  Destroy = 'destroy',
  Focus = 'focus',
}

export type Events = {
  [EventNames.Destroy]: BaseEditor;
  [EventNames.Focus]: { editor: BaseEditor; fromHistory?: Direction };
};
