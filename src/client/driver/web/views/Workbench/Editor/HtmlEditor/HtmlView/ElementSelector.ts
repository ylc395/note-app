import { offset, computePosition, autoUpdate, size } from '@floating-ui/dom';

export default class ElementSelector {
  private readonly root: HTMLElement | ShadowRoot;
  private overlayEl?: HTMLElement;
  private cancelAutoUpdate?: ReturnType<typeof autoUpdate>;
  private currentTarget?: HTMLElement;

  constructor(private readonly options: { onSelect: (el: HTMLElement) => void; root?: HTMLElement | ShadowRoot }) {
    this.root = options.root || document.body;
  }

  enable() {
    this.initOverlay();
    this.root.addEventListener('mouseover', this.handleHover);
    this.root.addEventListener('click', this.handleClick);
    this.root.addEventListener('contextmenu', this.handleContextmenu);
  }

  private disable() {
    this.clearOverlay();
    this.root.removeEventListener('mouseover', this.handleHover);
    this.root.removeEventListener('click', this.handleClick);
    this.root.removeEventListener('contextmenu', this.handleContextmenu);
  }

  private clearOverlay() {
    this.overlayEl?.remove();
    this.overlayEl = undefined;
  }

  private initOverlay() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.style.backgroundColor = 'blue';
    this.overlayEl.style.opacity = '0.2';
    this.overlayEl.style.position = 'fixed';
    this.overlayEl.style.pointerEvents = 'none';
    this.overlayEl.style.zIndex = '999';
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (this.root instanceof ShadowRoot ? this.root.host.parentElement! : this.root).appendChild(this.overlayEl);
  }

  private readonly handleClick = (e: Event) => {
    if (e.target === this.currentTarget) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.options.onSelect(this.currentTarget);
    }
  };

  private readonly handleContextmenu = (e: Event) => {
    if (e.target === this.currentTarget) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.disable();
    }
  };

  private readonly handleHover = (e: Event) => {
    this.cancelAutoUpdate?.();
    const target = e.target as HTMLElement;

    this.currentTarget = target;

    const { overlayEl } = this;

    if (!overlayEl) {
      throw new Error('no overlayEl');
    }

    this.cancelAutoUpdate = autoUpdate(target, overlayEl, async () => {
      const { x, y } = await computePosition(target, overlayEl, {
        strategy: 'fixed',
        middleware: [
          offset(({ rects }) => {
            return -rects.reference.height / 2 - rects.floating.height / 2;
          }),
          size({
            apply: ({ rects }) => {
              Object.assign(overlayEl.style, {
                width: `${rects.reference.width}px`,
                height: `${rects.reference.height}px`,
              });
            },
          }),
        ],
      });

      overlayEl.style.left = `${x}px`;
      overlayEl.style.top = `${y}px`;
    });
  };

  destroy() {
    this.disable();
    this.cancelAutoUpdate?.();
    this.clearOverlay();
    this.currentTarget = undefined;
  }
}
