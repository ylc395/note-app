import { createSlice, type Ctx } from '@milkdown/kit/ctx';
import { action, computed, observable } from 'mobx';

export default class TooltipManager {
  @observable private accessor elements = new Set<HTMLElement>();

  @action
  public add(el: HTMLElement) {
    this.elements.add(el);
  }

  @action
  public delete(el: HTMLElement) {
    this.elements.delete(el);
  }

  @computed
  public get isEmpty() {
    return this.elements.size === 0;
  }

  public static slice = createSlice({} as TooltipManager, 'tooltipManager');

  public static init(ctx: Ctx) {
    ctx.inject(TooltipManager.slice, new TooltipManager());
  }
}
