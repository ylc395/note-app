import type { InjectionToken } from 'tsyringe';
import type { NoteTreeNode } from 'model/tree/type';
import type { NoteMetadata } from 'model/form/type';
import type { ModalOptions, ContextmenuItem } from './ui';

export interface CommonInputs {
  confirm: (options: ModalOptions) => Promise<boolean>;
  getContextmenuAction: (items: ContextmenuItem[]) => Promise<string | null>;
  getFile: () => Promise<string | File | null>;
}

export interface NoteInputs {
  getNoteIdByTree: (selectedNodes: NoteTreeNode[]) => Promise<string | null | undefined>;
  editNoteMetadata: (metadata: NoteMetadata, note: { length: number; title: string }) => Promise<NoteMetadata>;
}

export default interface UserInput {
  common: CommonInputs;
  note: NoteInputs;
}

export const token: InjectionToken<UserInput> = Symbol('userInput');
