import z from 'zod';

export * from '../uiState';

export enum Panel {
  Body = 'body',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

export const schema = z.object({
  panels: z.record(z.string(), z.unknown()).catch({}),
});

export type UIState = z.infer<typeof schema>;
