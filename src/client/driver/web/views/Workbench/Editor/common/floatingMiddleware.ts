import { offset, size } from '@floating-ui/dom';

export const coverElementMiddleware = [
  offset(({ rects }) => {
    return -rects.reference.height / 2 - rects.floating.height / 2;
  }),
  size({
    apply: ({ rects, elements: { floating } }) => {
      Object.assign(floating.style, {
        width: `${rects.reference.width}px`,
        height: `${rects.reference.height}px`,
      });
    },
  }),
];
