import type { NoteVO } from 'interface/Note';
import type { InjectionToken } from 'tsyringe';

export default interface UserInput {
  note: {
    getNoteIdByTree: () => Promise<NoteVO['parentId'] | undefined>;
  };
}

export const token: InjectionToken<UserInput> = Symbol('userInput');
