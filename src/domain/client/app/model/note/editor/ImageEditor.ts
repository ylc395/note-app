import { z } from 'zod';
import BaseEditor, { type Options } from './BaseEditor';

const uiStateSchema = z.object({
  titleSelection: z.tuple([z.number(), z.number()]).optional(),
  bodySelection: z.tuple([z.number(), z.number()]).optional(),
  scrollTop: z.number().optional(),
});

export default class ImageEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor({ mimeType, ...options }: Options & { mimeType: string }) {
    super({ ...options, uiStateSchema });
    this.mimeType = mimeType;
  }

  public override readonly mimeType;

  protected sortAnnotations() {
    return 0;
  }
}
