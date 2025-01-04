import type Tile from './Tile';

export type TileNode = TileParent | Tile['id'];

export enum TileDirections {
  Horizontal,
  Vertical,
}

export interface TileParent {
  id: string;
  direction: TileDirections;
  first: TileNode;
  second: TileNode;
  splitPercentage?: number; // first tile's width
}

export const isTileLeaf = (v: TileNode): v is Tile['id'] => typeof v === 'string';
