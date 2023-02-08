import type { InjectionToken } from 'tsyringe';
import type { ModalOptions, ContextmenuItem } from './ui';

interface NoteTreeNode {
  key: string;
  title: string;
  parent?: NoteTreeNode;
}

export default interface UserInput {
  common: {
    confirm: (options: ModalOptions) => Promise<boolean>;
    getContextmenuAction: (items: ContextmenuItem[]) => Promise<string | null>;
  };
  note: {
    getNoteIdByTree: (selectedNodes: NoteTreeNode[]) => Promise<string | null | undefined>;
  };
}

export const token: InjectionToken<UserInput> = Symbol('userInput');
