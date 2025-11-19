import Okvm from '#domain/client/shared/model/abstract/Okvm';
import z from 'zod';
import { tileNodeSchema, type TileNode } from './tileTree';

const tilesSchema = z.record(
  z.string(),
  z.object({
    editors: z.array(z.object({ entityId: z.string(), title: z.string(), mimeType: z.string().nullable() })),
    current: z.string(),
  }),
);

export default class UIState extends Okvm {
  @Okvm.expose(tileNodeSchema.optional())
  public accessor root: TileNode | undefined = undefined;

  @Okvm.expose(z.string().optional())
  public accessor focusedId: string | undefined = undefined;

  @Okvm.expose(tilesSchema.optional())
  public accessor tiles: z.infer<typeof tilesSchema> | undefined = undefined;

  public update(params: Pick<UIState, 'root' | 'focusedId' | 'tiles'>) {
    Object.assign(this, params);
    this.debouncedSave();
  }
}
