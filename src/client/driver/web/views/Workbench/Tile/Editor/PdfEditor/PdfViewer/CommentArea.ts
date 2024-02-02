import { action, computed, makeObservable, observable } from 'mobx';
import assert from 'assert';

import type { SelectionEvent } from '../../common/SelectionManager';
import AnnotationManager from './AnnotationManager';
import { uniq } from 'lodash-es';

export default class CommentArea {
  constructor(private readonly annotationManager: AnnotationManager) {
    makeObservable(this);
  }

  @observable.ref
  public selection?: SelectionEvent;

  @observable
  public color = 'yellow';

  @observable.ref
  private fragments: {
    color: string;
    left: number;
    right: number;
    top: number;
    bottom: number;
    page: number;
  }[] = [];

  @computed
  public get pages() {
    return uniq(this.fragments.map(({ page }) => page));
  }

  public getRectsOfPage(page: number) {
    const fragments = this.fragments.filter(({ page: _page }) => _page === page) || [];
    const { horizontalRatio, verticalRatio } = this.annotationManager.getPageRatio(page);

    return fragments.map(({ left, right, top, bottom, color }) => ({
      left: Number(left) * horizontalRatio,
      right: Number(right) * horizontalRatio,
      top: Number(top) * verticalRatio,
      bottom: Number(bottom) * verticalRatio,
      color,
    }));
  }

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
    this.fragments = this.getFragments();
  }

  @action.bound
  public close() {
    this.selection?.markEl.remove();
    this.selection = undefined;
    this.fragments = [];
  }

  private getFragments() {
    if (!this.selection) {
      return [];
    }

    const fragments = this.annotationManager.getFragments(this.selection.range);

    return fragments.map((fragment) => ({
      color: this.color,
      ...fragment,
    }));
  }

  @action
  public async submit(content: string) {
    assert(this.selection);
    await this.annotationManager.createAnnotation({ body: content, color: this.color }, this.selection);
    this.close();
  }
}
