import type { NoteVO } from 'interface/Note';
import type { NoteTreeNode } from 'model/tree/NoteTree';
import type { InjectionToken } from 'tsyringe';

import type { ModalOptions } from './UserFeedback';

export default interface UserInput {
  common: {
    confirm: (options: ModalOptions) => Promise<boolean>;
  };
  note: {
    getNoteIdByTree: (selectedNodes: NoteTreeNode[]) => Promise<NoteVO['parentId'] | undefined>;
  };
}

export const token: InjectionToken<UserInput> = Symbol('userInput');
