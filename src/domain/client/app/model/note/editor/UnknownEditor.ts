import { z } from 'zod';
import BaseEditor, { type Options } from './BaseEditor';

export default class UnknownEditor extends BaseEditor<never> {
  constructor({ mimeType, ...options }: Options & { mimeType: string }) {
    super({ ...options, uiStateSchema: z.never() });
    this.mimeType = mimeType;
  }

  public override readonly mimeType;

  protected sortAnnotations() {
    return 0;
  }
}
