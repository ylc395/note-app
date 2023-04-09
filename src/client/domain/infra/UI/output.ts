import type { InjectionToken } from 'tsyringe';
import type { MessageOptions, ModalOptions } from './type';

export interface CommonOutput {
  modal: {
    success: (option: ModalOptions) => Promise<void>;
  };
  message: {
    success: (option: MessageOptions) => Promise<void>;
  };
}

export const commonOutputToken: InjectionToken<CommonOutput> = Symbol();
