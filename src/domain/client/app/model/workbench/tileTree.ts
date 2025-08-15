import z from 'zod';
import type Tile from './Tile';

export enum TileDirections {
  Horizontal,
  Vertical,
}

const tileParentSchema = z.object({
  id: z.string(),
  direction: z.enum(TileDirections),
  splitPercentage: z.number().optional(),
  get first() {
    return tileNodeSchema;
  },

  get second() {
    return tileNodeSchema;
  },
});

export const tileNodeSchema = z.union([tileParentSchema, z.string()]);

export type TileParent = z.infer<typeof tileParentSchema>;

export type TileNode = z.infer<typeof tileNodeSchema>;

export const isTileLeaf = (v: TileNode): v is Tile['id'] => typeof v === 'string';
