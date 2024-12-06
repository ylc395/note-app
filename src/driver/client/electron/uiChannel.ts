import { object, string, array, unknown as zodUnknown, type infer as ZodInfer } from 'zod';

export const UI_CHANNEL = 'electron-ui';

export const uiIpcPayloadSchema = object({
  funcName: string().refine((v) => !v.startsWith('_')),
  args: array(zodUnknown()),
});

export type UIIpcPayload = ZodInfer<typeof uiIpcPayloadSchema>;
