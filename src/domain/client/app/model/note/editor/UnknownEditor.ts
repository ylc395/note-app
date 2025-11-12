import type Tile from '../../Workbench/Tile';
import BaseEditor, { type Options } from './BaseEditor';

export default class UnknownEditor extends BaseEditor {
  constructor(tile: Tile, { mimeType, ...options }: Options & { mimeType: string }) {
    super(tile, options);
    this.mimeType = mimeType;
  }

  public override readonly mimeType;

  protected sortAnnotations() {
    return 0;
  }
}
