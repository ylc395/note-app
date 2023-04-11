import type { InjectionToken } from 'tsyringe';

import type { MaterialDTO } from 'interface/material';

import type { ModalOptions } from './type';

export interface CommonInput {
  confirm: (options: ModalOptions) => Promise<boolean>;
}

export const commonInputToken: InjectionToken<CommonInput> = Symbol();

export interface MaterialDomain {
  getNewMaterial: () => Promise<Pick<MaterialDTO, 'file' | 'sourceUrl' | 'text'> | undefined>;
}

export const materialDomainInputToken: InjectionToken<MaterialDomain> = Symbol();
