import type BaseEditor from './BaseEditor';

export enum EventNames {
  Destroy = 'editor.destroy',
  Focus = 'editor.focus',
  Ready = 'editor.ready',
}

export type Events = {
  [EventNames.Destroy]: BaseEditor;
  [EventNames.Focus]: BaseEditor;
  [EventNames.Ready]: BaseEditor;
};
