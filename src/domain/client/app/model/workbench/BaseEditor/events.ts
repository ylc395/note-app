import type BaseEditor from './index';

export enum EventNames {
  Destroy = 'editor.destroy',
  Focus = 'editor.focus',
}

export type Events<T> = {
  [EventNames.Destroy]: BaseEditor<T>;
  [EventNames.Focus]: BaseEditor<T>;
};
