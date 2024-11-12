import { object, string, array, unknown as zodUnknown, type infer as ZodInfer } from 'zod';
import type { UI } from './common.js';

export const UI_CHANNEL = 'electron-ui';

export const uiIpcPayloadSchema = object({
  funcName: string().refine((v) => !v.startsWith('_')),
  args: array(zodUnknown()),
});

export type ElectronUI = Pick<UI, 'getActionFromMenu' | 'openNewWindow'>;

export type UIIpcPayload = ZodInfer<typeof uiIpcPayloadSchema>;

export * from './menu.js';
