import type { InjectionToken } from 'tsyringe';

import type { NoteTreeNode } from 'model/note/Tree/type';
import type { NoteMetadata } from 'model/note/MetadataForm/type';
import type { NoteVO } from 'interface/Note';

import type { ModalOptions, ContextmenuItem } from './ui';

export interface CommonInputs {
  confirm: (options: ModalOptions) => Promise<boolean>;
  getContextmenuAction: (items: ContextmenuItem[]) => Promise<string | null>;
  getFile: () => Promise<string | File | null>;
}

export interface NoteInputs {
  getMoveTargetNoteId: (selectedNodes: NoteTreeNode[]) => Promise<NoteVO['parentId'] | undefined>;
  editNoteMetadata: (
    metadata: NoteMetadata,
    note: { length: number; title: string; icons: NoteVO['icon'][] },
  ) => Promise<NoteMetadata | undefined>;
}

export default interface UserInput {
  common: CommonInputs;
  note: NoteInputs;
}

export const token: InjectionToken<UserInput> = Symbol('userInput');
