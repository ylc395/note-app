import { observable } from 'mobx';
import z from 'zod';

export default class BodyEditor {
  @observable public accessor uiState: z.infer<typeof BodyEditor.schema> = {};

  public init(state?: BodyEditor['uiState']) {
    if (state) {
      this.uiState = state;
    }
  }

  public static schema = z.object({
    isEnabled: z.boolean().optional().catch(undefined),
    width: z.number().optional().catch(undefined),
    isFloating: z.boolean().optional().catch(undefined),
    floatingPos: z.object({ x: z.number(), y: z.number() }).nullish().catch(undefined),
  });
}
