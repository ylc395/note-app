import { TileDirections, type TileParent } from '@domain/model/workbench';

export interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function getAbsoluteSplitPercentage(boundingBox: BoundingBox, node: TileParent) {
  const { top, right, bottom, left } = boundingBox;
  const { direction, splitPercentage = 50 } = node;
  if (direction === TileDirections.Vertical) {
    const height = 100 - top - bottom;
    return (height * splitPercentage) / 100 + top;
  } else {
    const width = 100 - right - left;
    return (width * splitPercentage) / 100 + left;
  }
}

export function getRelativeSplitPercentage(
  boundingBox: BoundingBox,
  absoluteSplitPercentage: number,
  direction: TileDirections,
) {
  const { top, right, bottom, left } = boundingBox;
  if (direction === TileDirections.Vertical) {
    const height = 100 - top - bottom;
    return ((absoluteSplitPercentage - top) / height) * 100;
  } else {
    const width = 100 - right - left;
    return ((absoluteSplitPercentage - left) / width) * 100;
  }
}
