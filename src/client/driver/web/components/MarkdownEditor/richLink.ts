import { linkSchema } from '@milkdown/preset-commonmark';
import { container } from 'tsyringe';
import IconLoader from './helper/IconLoader';

export default linkSchema.extendSchema((prev) => {
  return (ctx) => {
    const originSchema = prev(ctx);
    const iconLoader = container.resolve(IconLoader);

    return {
      ...originSchema,
      toDOM(mark) {
        const aEl = document.createElement('a');
        Object.entries(mark.attrs).forEach(([k, v]) => {
          aEl.setAttribute(k, v);
        });

        if (typeof mark.attrs.href === 'string') {
          iconLoader.load(mark.attrs.href).then((dataUrl) => {
            if (dataUrl) {
              aEl.style.backgroundImage = `url(${dataUrl})`;
              aEl.style.backgroundRepeat = 'no-repeat';
              aEl.style.backgroundPosition = '0 center';
              aEl.style.paddingLeft = '1em';
            }
          });
        }

        return aEl;
      },
    };
  };
});
