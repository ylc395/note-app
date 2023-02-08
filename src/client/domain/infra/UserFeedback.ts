import type { InjectionToken } from 'tsyringe';
import type { ModalOptions, MessageOptions } from './ui';

interface Modal {
  success: (option: ModalOptions) => Promise<void>;
}

interface Message {
  success: (option: MessageOptions) => Promise<void>;
}

export default interface UserFeedback {
  modal: Modal;
  message: Message;
}

export const token: InjectionToken<UserFeedback> = Symbol('feedback');
