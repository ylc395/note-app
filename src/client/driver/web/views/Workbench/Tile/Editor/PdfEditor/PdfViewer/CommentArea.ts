import { action, makeObservable, observable } from 'mobx';
import assert from 'assert';

import type { SelectionEvent } from '../../common/SelectionManager';
import AnnotationManager from './AnnotationManager';

const DEFAULT_COLOR = 'red';

export default class CommentArea {
  constructor(private readonly annotationManager: AnnotationManager) {
    makeObservable(this);
  }

  @observable.ref
  public selection?: SelectionEvent;

  @observable
  public color?: string;

  @observable.ref
  public rects: {
    color: string;
    left: number;
    width: number;
    top: number;
    height: number;
  }[] = [];

  @action.bound
  public open() {
    const { currentSelection } = this.annotationManager;
    assert(currentSelection);

    this.selection = {
      ...currentSelection,
      markEl: document.createElement('span'),
    };

    const range = currentSelection.range.cloneRange();
    range.collapse(currentSelection.markElPosition === 'top');
    range.insertNode(this.selection.markEl);
    this.selection.markEl.style.height = '1em';

    this.rects = this.getRects();
    this.annotationManager.updateSelection(null);
  }

  @action.bound
  public close() {
    assert(this.selection);

    this.selection.markEl.remove();
    this.selection = undefined;
    this.rects = [];
  }

  private getRects() {
    if (!this.selection) {
      return [];
    }

    const page = AnnotationManager.getPageOfNode(this.selection.markEl);
    const { left: pageLeft, top: pageTop } = this.annotationManager.getPageRect(page);
    const rangeRects = Array.from(this.selection.range.getClientRects());

    return rangeRects.map((rect) => ({
      color: this.color || DEFAULT_COLOR,
      left: rect.left - pageLeft,
      width: rect.width,
      top: rect.top - pageTop,
      height: rect.height,
    }));
  }
}
