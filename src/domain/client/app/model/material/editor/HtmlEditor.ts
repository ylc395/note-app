import { observable, action, computed } from 'mobx';

import MaterialEditor from './MaterialEditor';
import UIState from '../../abstract/UIState';
import { number, object } from 'zod';

export enum Panels {
  Outline,
  AnnotationList,
}

const uiStateSchema = object({
  scrollTop: number().optional(),
});

export default class HtmlEditor extends MaterialEditor {
  public readonly uiState = new UIState(`editor-${this.entityLocator.entityId}`, uiStateSchema);

  @observable.ref public accessor documentElement: unknown | undefined;

  @observable public accessor panelsVisibility = {
    [Panels.Outline]: false,
    [Panels.AnnotationList]: true,
  };

  @action
  public togglePanel(panel: Panels) {
    this.panelsVisibility[panel] = !this.panelsVisibility[panel];
  }

  protected sortAnnotations() {
    return 0;
  }

  @computed
  public get html() {
    if (!this.blob) {
      return undefined;
    }

    const textDecoder = new TextDecoder();
    return textDecoder.decode(this.blob);
  }
}
