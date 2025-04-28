import { z } from 'zod';
import BaseEditor, { Options } from './BaseEditor';

const uiStateSchema = z.object({
  titleSelection: z.tuple([z.number(), z.number()]).optional(),
  bodySelection: z.tuple([z.number(), z.number()]).optional(),
  scrollTop: z.number().optional(),
});

export default class MarkdownEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor(options: Options) {
    super({ ...options, uiState: { schema: uiStateSchema, defaultValue: {} } });
  }

  public override mimeType = null;
}
