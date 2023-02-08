import type { InjectionToken } from 'tsyringe';
import type { NotesDTO } from 'interface/Note';
import type { NoteTreeNode } from 'model/tree/type';
import type { ModalOptions, ContextmenuItem } from './ui';

export default interface UserInput {
  common: {
    confirm: (options: ModalOptions) => Promise<boolean>;
    getContextmenuAction: (items: ContextmenuItem[]) => Promise<string | null>;
  };
  note: {
    getNoteIdByTree: (selectedNodes: NoteTreeNode[]) => Promise<string | null | undefined>;
    editNotes: (noteIds: string[]) => Promise<NotesDTO>;
  };
}

export const token: InjectionToken<UserInput> = Symbol('userInput');
