import type { InjectionToken } from 'tsyringe';

export interface ModalOptions {
  title: string;
  content: string;
}

interface Modal {
  success: (option: ModalOptions) => Promise<void>;
}

interface MessageOptions {
  content: string;
  onClick?: () => void;
}

interface Message {
  success: (option: MessageOptions) => Promise<void>;
}

export default interface UserFeedback {
  modal: Modal;
  message: Message;
}

export const token: InjectionToken<UserFeedback> = Symbol('feedback');
