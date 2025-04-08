import { z } from 'zod';
import { observable, action, computed } from 'mobx';

import { MimeTypes } from '#domain/shared/model/file';
import BaseEditor, { type Options } from './BaseEditor';

export enum Panels {
  Outline,
  AnnotationList,
}

const uiStateSchema = z.object({
  titleSelection: z.tuple([z.number(), z.number()]).optional(),
  bodySelection: z.tuple([z.number(), z.number()]).optional(),
  scrollTop: z.number().optional(),
});

export default class HtmlEditor extends BaseEditor<z.infer<typeof uiStateSchema>> {
  constructor(options: Options) {
    super({ ...options, uiStateSchema });
  }

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

  @computed
  public get html() {
    if (!this.blob.result.data) {
      return undefined;
    }

    const textDecoder = new TextDecoder();
    return textDecoder.decode(this.blob.result.data);
  }
}
