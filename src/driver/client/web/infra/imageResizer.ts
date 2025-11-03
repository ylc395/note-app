import type { ImageResizer } from '#domain/shared/infra/imageResizer';
import pica from 'pica';

const getSize: ImageResizer['getSize'] = async (image) => {
  const { height, width } = await createImageBitmap(new Blob([image]));
  return { height, width };
};

const resize: ImageResizer['resize'] = async ({ image, mimeType, ...size }) => {
  const p = pica();
  const bitmap = await createImageBitmap(new Blob([image]));
  const canvas = document.createElement('canvas');
  canvas.height = size.height;
  canvas.width = size.width;

  const newCanvas = await p.resize(bitmap, canvas);
  return p.toBlob(newCanvas, mimeType).then((blob) => blob.arrayBuffer());
};

export default { getSize, resize } satisfies ImageResizer;
