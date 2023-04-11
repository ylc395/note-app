import type { InjectionToken } from 'tsyringe';

import type { NoteVO } from 'interface/Note';
import type { MaterialDTO } from 'interface/material';
import type { NoteTreeNode } from 'model/note/Tree/type';
import type { NoteMetadata } from 'model/note/MetadataForm/type';

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

export interface MaterialDomain {
  getNewMaterial: () => Promise<Pick<MaterialDTO, 'file' | 'sourceUrl' | 'text'> | undefined>;
}

export const noteDomainInputToken: InjectionToken<NoteDomain> = Symbol();
export const materialDomainInputToken: InjectionToken<MaterialDomain> = Symbol();
