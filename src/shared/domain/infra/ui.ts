import type { InjectionToken } from 'tsyringe';
import { object, string, array, unknown as zodUnknown, type infer as ZodInfer } from 'zod';

export type MenuItem =
  | {
      label: string;
      key?: string;
      disabled?: boolean;
      submenu?: MenuItem[];
    }
  | { type: 'separator' };

export type PromptToken<T> = { _RESULT_TYPE_: T } | symbol;

export interface UI {
  getActionFromMenu: (items: MenuItem[], pos?: { x: number; y: number }) => Promise<string | null>;
  openNewWindow: (url: string) => Promise<void> | void;
  prompt: <T>(promptToken: PromptToken<T>) => Promise<T | undefined>;
}

export const token: InjectionToken<UI> = Symbol();

export const UI_CHANNEL = 'electron-ui';

export const uiIpcPayloadSchema = object({
  funcName: string().refine((v) => !v.startsWith('_')),
  args: array(zodUnknown()),
});

export type UIIpcPayload = ZodInfer<typeof uiIpcPayloadSchema>;
