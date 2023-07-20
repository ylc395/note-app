import { computePosition, autoUpdate } from '@floating-ui/dom';
import { coverElementMiddleware } from 'components/floatingMiddleware';

export default class ElementSelector {
  private overlayEl?: HTMLElement;
  private styleEl?: HTMLStyleElement;
  private cancelAutoUpdate?: ReturnType<typeof autoUpdate>;
  private currentTarget?: HTMLElement;

  constructor(
    private readonly options: {
      onSelect: (el: HTMLElement) => void;
      onCancel?: () => void;
      selectableRoot?: HTMLElement | ShadowRoot;
      cancelableRoot?: HTMLElement;
    },
  ) {}

  private get selectableRoot() {
    return this.options.selectableRoot || document.body;
  }

  get isEnabled() {
    return Boolean(this.overlayEl);
  }

  enable() {
    if (this.isEnabled) {
      throw new Error('enabled');
    }

    this.initOverlay();
    this.initStyle();
    this.selectableRoot.addEventListener('mouseover', this.handleHover);
    this.selectableRoot.addEventListener('click', this.handleClick);
    document.body.addEventListener('contextmenu', this.handleContextmenu);
    document.body.addEventListener('keyup', this.handleKeyup);
  }

  disable() {
    this.selectableRoot.removeEventListener('mouseover', this.handleHover);
    this.selectableRoot.removeEventListener('click', this.handleClick);
    document.body.removeEventListener('contextmenu', this.handleContextmenu);
    document.body.removeEventListener('keyup', this.handleKeyup);
    this.cancelAutoUpdate?.();
    this.overlayEl?.remove();
    this.styleEl?.remove();
    this.overlayEl = undefined;
    this.styleEl = undefined;
    this.currentTarget = undefined;
  }

  private initOverlay() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.style.backgroundColor = 'blue';
    this.overlayEl.style.opacity = '0.2';
    this.overlayEl.style.position = 'absolute';
    this.overlayEl.style.pointerEvents = 'none';
    this.overlayEl.style.zIndex = '999';
    this.selectableRoot.appendChild(this.overlayEl);
  }

  private initStyle() {
    const style = document.createElement('style');
    style.innerHTML = '* {cursor: default !important}';

    if (this.selectableRoot instanceof ShadowRoot) {
      const el =
        this.selectableRoot.querySelector('head') || this.selectableRoot.querySelector('body') || this.selectableRoot;
      el.append(style);
    } else {
      document.head.append(style);
    }

    this.styleEl = style;
  }

  private readonly handleClick = (e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    if (e.target === this.currentTarget) {
      this.options.onSelect(this.currentTarget);
    }
  };

  private readonly handleContextmenu = (e: Event) => {
    const isValid =
      (this.selectableRoot instanceof ShadowRoot ? this.selectableRoot.host : this.selectableRoot).contains(
        e.target as HTMLElement,
      ) || this.options.cancelableRoot?.contains(e.target as HTMLElement);

    if (isValid) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.disable();
      this.options.onCancel?.();
    }
  };

  private readonly handleKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.options.onCancel?.();
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
      const { x, y } = await computePosition(target, overlayEl, { middleware: coverElementMiddleware });

      overlayEl.style.left = `${x}px`;
      overlayEl.style.top = `${y}px`;
    });
  };
}
