import { action, makeObservable, observable } from 'mobx';
import assert from 'assert';

import type { AnnotationVO } from '@shared/domain/model/annotation';
import type { SelectionEvent } from '../../common/SelectionManager';
import AnnotationManager from './AnnotationManager';

export default class CommentArea {
  constructor(private readonly annotationManager: AnnotationManager) {
    makeObservable(this);
  }

  // comment area must keep its own selection state
  // because AnnotationManager's selection will be erased when comment area is focused
  @observable.ref public selection?: SelectionEvent;

  @observable public tempAnnotation?: AnnotationVO;

  @observable public color = 'yellow';

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
    const selectors = this.annotationManager.rangeToSelectors(currentSelection.range);
    this.tempAnnotation = {
      id: '__TEMP_ANNOTATION',
      targetId: this.annotationManager.editor.entityLocator.entityId,
      targetText: null,
      selectors,
      body: '',
      color: this.color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  @action.bound
  public close() {
    assert(this.selection);
    this.selection?.markEl.remove();
    this.selection = undefined;
    this.tempAnnotation = undefined;
  }

  @action
  public async submit(content: string) {
    assert(this.selection);
    await this.annotationManager.createAnnotation({ body: content, color: this.color }, this.selection.range);
    this.close();
  }
}
