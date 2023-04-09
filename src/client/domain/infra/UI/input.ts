import type { InjectionToken } from 'tsyringe';

import type { NoteTreeNode } from 'model/note/Tree/type';
import type { NoteMetadata } from 'model/note/MetadataForm/type';
import type { NoteVO } from 'interface/Note';

import type { ModalOptions } from './type';

export interface CommonInput {
  confirm: (options: ModalOptions) => Promise<boolean>;
}

export const commonInputToken: InjectionToken<CommonInput> = Symbol();

export interface NoteDomain {
  getMoveTargetNoteId: (selectedNodes: NoteTreeNode[]) => Promise<NoteVO['parentId'] | undefined>;
  editNoteMetadata: (
    metadata: NoteMetadata,
    note: { length: number; title: string; icons: NoteVO['icon'][] },
  ) => Promise<NoteMetadata | undefined>;
}

export const noteDomainInputToken: InjectionToken<NoteDomain> = Symbol();