import { makeObservable, computed, observable, action } from 'mobx';
import { offset, computePosition, autoUpdate, size } from '@floating-ui/dom';

export const middleware = [
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

export default class ElementSelector {
  @observable.ref
  private overlayEl?: HTMLElement;
  private styleEl?: HTMLStyleElement;
  private cancelAutoUpdate?: ReturnType<typeof autoUpdate>;
  private currentTarget?: HTMLElement;

  constructor(
    private readonly options: {
      onSelect: (el: HTMLElement) => void;
      selectableRoot?: HTMLElement | ShadowRoot;
      cancelableRoot?: HTMLElement;
    },
  ) {
    makeObservable(this);
  }

  private get selectableRoot() {
    return this.options.selectableRoot || document.body;
  }

  @computed
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

  @action
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

  @action
  private initOverlay() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.style.backgroundColor = 'blue';
    this.overlayEl.style.opacity = '0.2';
    this.overlayEl.style.position = 'fixed';
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
    }
  };

  private readonly handleKeyup = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
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
      const { x, y } = await computePosition(target, overlayEl, { middleware });

      overlayEl.style.left = `${x}px`;
      overlayEl.style.top = `${y}px`;
    });
  };
}
