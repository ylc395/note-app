import type { InjectionToken } from 'tsyringe';

interface ModalOptions {
  title: string;
  content: string;
}

interface Modal {
  confirm: (option: ModalOptions) => Promise<'ok' | 'cancel'>;
}

interface MessageOptions {
  content: string;
}

interface Message {
  success: (option: MessageOptions) => Promise<void>;
}

export default interface UserFeedback {
  modal: Modal;
  message: Message;
}

export const token: InjectionToken<UserFeedback> = Symbol('feedback');
