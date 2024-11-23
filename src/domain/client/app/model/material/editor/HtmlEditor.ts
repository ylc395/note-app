import { observable, action, computed } from 'mobx';

import MaterialEditor from './MaterialEditor';

interface State {
  scrollTop: number;
}

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditor extends MaterialEditor<State> {
  @observable.ref public documentElement?: unknown;

  @observable
  public panelsVisibility = {
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
