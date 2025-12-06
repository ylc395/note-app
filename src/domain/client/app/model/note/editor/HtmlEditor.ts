import { observable, computed } from 'mobx';

import { MimeTypes } from '#domain/shared/model/file';
import { toText } from '#utils/file';
import BaseEditor from './BaseEditor';

export enum Panels {
  Outline,
  AnnotationList,
}

export default class HtmlEditor extends BaseEditor {
  @observable.ref public accessor documentElement: unknown | undefined;

  public override readonly mimeType = MimeTypes.HTML;

  @computed
  public get html() {
    return this.blob.result.data && toText(this.blob.result.data);
  }
}
