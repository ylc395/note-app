import { observable, toJS } from 'mobx';
import z from 'zod';

export default class BodyEditor {
  @observable public accessor uiState: z.infer<typeof BodyEditor.schema> = {};

  public init(state?: BodyEditor['uiState']) {
    if (state) {
      this.uiState = state;
    }
  }

  public toJSON() {
    return toJS(this.uiState);
  }

  public static schema = z.object({
    isEnabled: z.boolean().optional().catch(undefined),
    width: z.number().optional().catch(undefined),
    isFloating: z.boolean().optional().catch(undefined),
    floatingPos: z.object({ x: z.number(), y: z.number() }).nullish().catch(undefined),
    focusPos: z.number().nullish().catch(undefined),
    floatingSize: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional()
      .catch(undefined),
    scroll: z.object({ x: z.number(), y: z.number() }).optional().catch(undefined),
    cursorPos: z.object({ anchor: z.number(), head: z.number() }).optional().catch(undefined),
  });
}
