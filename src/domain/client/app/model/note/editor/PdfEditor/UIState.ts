import z from 'zod';
import { action, observable } from 'mobx';
import Odm from '#domain/client/shared/model/abstract/Odm';

import EditorUIState from '../BaseUIState';

export enum Panel {
  Body = 'body',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

export type TogglablePanel = Panel.Annotation | Panel.Body;

const panelSchema = z.object({ isVisible: z.boolean(), size: z.number() });

const panelsSchema = z
  .object({
    [Panel.Annotation]: panelSchema,
    [Panel.Body]: panelSchema,
  })
  .partial();

export default class PdfEditorUIState extends EditorUIState {
  @observable
  @Odm.expose(panelsSchema)
  public accessor panels: z.infer<typeof panelsSchema> = {};

  @action
  @Odm.autoSave()
  public togglePanel(id: TogglablePanel) {
    const panel = this.panels?.[id];
    this.panels ||= {};

    if (!panel) {
      this.panels[id] = { isVisible: true, size: 30 };
    } else {
      panel.isVisible = !panel.isVisible;
    }
  }

  public static isTogglablePanel(id: string): id is TogglablePanel {
    return ([Panel.Annotation, Panel.Body] as string[]).includes(id);
  }
}
