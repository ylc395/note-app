import type Tile from '../Tile';
import BaseEditor, { type Options } from './BaseEditor';

export default class ImageEditor extends BaseEditor {
  constructor(tile: Tile, { mimeType, ...options }: Options & { mimeType: string }) {
    super(tile, options);
    this.mimeType = mimeType;
  }

  public override readonly mimeType;
}
