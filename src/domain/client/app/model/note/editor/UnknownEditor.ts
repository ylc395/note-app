import BaseEditor, { type Options } from './BaseEditor';

export default class UnknownEditor extends BaseEditor {
  constructor(options: Options & { mimeType: string }) {
    super(options);
    this.mimeType = options.mimeType;
  }

  public override readonly mimeType;

  protected sortAnnotations() {
    return 0;
  }
}
