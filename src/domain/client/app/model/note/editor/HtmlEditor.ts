import { observable, action, computed } from 'mobx';

import { MimeTypes } from '#domain/shared/model/file';
import BaseEditor from './BaseEditor';

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditor extends BaseEditor {
  @observable.ref public accessor documentElement: unknown | undefined;

  public override readonly mimeType = MimeTypes.HTML;

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
    if (!this.blob.result.data) {
      return undefined;
    }

    const textDecoder = new TextDecoder();
    return textDecoder.decode(this.blob.result.data);
  }
}
