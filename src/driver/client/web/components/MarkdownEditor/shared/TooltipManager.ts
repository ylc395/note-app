import { createSlice, type Ctx } from '@milkdown/kit/ctx';
import { action, observable } from 'mobx';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface Tooltip {
  canAutoHide: boolean | (() => boolean);
  hide: () => void;
}

export default class TooltipManager {
  @observable private accessor tooltips = new Map<HTMLElement, Tooltip>();

  @action
  public add(el: HTMLElement, tooltip: Tooltip) {
    this.tooltips.set(el, tooltip);
  }

  public hideOverlapping(newRect: Rect) {
    const hideFn: Tooltip['hide'][] = [];

    for (const [el, { canAutoHide, hide }] of this.tooltips.entries()) {
      const rect = {
        x: parseInt(el.style.left),
        y: parseInt(el.style.right),
        width: el.clientWidth,
        height: el.clientHeight,
      };

      const isOverlapping = !(
        rect.x + rect.width <= newRect.x ||
        rect.x >= newRect.x + newRect.width ||
        rect.y + rect.height <= newRect.y ||
        rect.y >= newRect.y + newRect.height
      );

      if (isOverlapping) {
        if (typeof canAutoHide === 'function' ? canAutoHide() : canAutoHide) {
          return false;
        }

        hideFn.push(hide);
      }
    }

    for (const fn of hideFn) {
      fn();
    }

    return true;
  }

  @action
  public remove(el: HTMLElement) {
    this.tooltips.delete(el);
  }

  public static slice = createSlice({} as TooltipManager, 'tooltipManager');

  public static init(ctx: Ctx) {
    ctx.inject(TooltipManager.slice, new TooltipManager());
  }
}
