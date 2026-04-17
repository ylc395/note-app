import type BaseEditor from './index';

export enum EventNames {
  Destroy = 'editor.destroy',
  Focus = 'editor.focus',
  Ready = 'editor.ready',
}

export type Events<T> = {
  [EventNames.Destroy]: BaseEditor<T>;
  [EventNames.Focus]: BaseEditor<T>;
  [EventNames.Ready]: BaseEditor<T>;
};
