import { offset, computePosition, autoUpdate, size } from '@floating-ui/dom';
import debounce from 'lodash/debounce';

export default class AreaSelector {
  private overlayEl = document.createElement('div');
  private cancelAutoUpdate?: ReturnType<typeof autoUpdate>;
  private currentTarget?: HTMLElement;

  constructor() {
    this.initOverlay();
    document.body.addEventListener('mouseover', this.handleHover);
    document.body.addEventListener('click', this.handleClick);
    document.body.addEventListener('contextmenu', this.handleContextmenu);
  }

  private disable() {
    document.body.removeEventListener('mouseover', this.handleHover);
    document.body.removeEventListener('click', this.handleClick);
    document.body.removeEventListener('contextmenu', this.handleContextmenu);
  }

  private initOverlay() {
    this.overlayEl.style.backgroundColor = 'blue';
    this.overlayEl.style.opacity = '0.2';
    this.overlayEl.style.position = 'fixed';
    this.overlayEl.style.pointerEvents = 'none';
    this.overlayEl.style.zIndex = '999';
    document.body.appendChild(this.overlayEl);
  }

  private readonly handleClick = (e: MouseEvent) => {
    if (e.target === this.currentTarget) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.disable();
      this.submit();
    }
  };

  private submit() {
    fetch('http://localhost:3001/materials', {
      method: 'POST',
      headers: {
        authorization: '47929996-9af9-4786-8589-3e57fc6119c6',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        parentId: 'b71a9626df5d47829005a7ac4acde150',
        file: { mimeType: 'text/html', data: this.targetToHtml() },
      }),
    });
  }

  private targetToHtml() {
    if (!this.currentTarget) {
      throw new Error('no currentTarget');
    }

    return `<h1>hello world</h1>`;
  }

  private readonly handleContextmenu = (e: MouseEvent) => {
    if (e.target === this.currentTarget) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.destroy();
    }
  };

  private readonly handleHover = debounce((e: MouseEvent) => {
    this.cancelAutoUpdate?.();
    const target = e.target as HTMLElement;
    this.currentTarget = target;

    this.cancelAutoUpdate = autoUpdate(target, this.overlayEl, async () => {
      const { x, y } = await computePosition(target, this.overlayEl, {
        strategy: 'fixed',
        middleware: [
          offset(({ rects }) => {
            return -rects.reference.height / 2 - rects.floating.height / 2;
          }),
          size({
            apply: ({ rects }) => {
              Object.assign(this.overlayEl.style, {
                width: `${rects.reference.width}px`,
                height: `${rects.reference.height}px`,
              });
            },
          }),
        ],
      });

      this.overlayEl.style.left = `${x}px`;
      this.overlayEl.style.top = `${y}px`;
    });
  }, 80);

  destroy() {
    this.handleHover.cancel();
    this.disable();
    this.cancelAutoUpdate?.();
    this.overlayEl.remove();
    this.currentTarget = undefined;
  }
}
