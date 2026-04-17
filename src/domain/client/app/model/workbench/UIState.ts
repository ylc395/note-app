import z from 'zod';
import { action } from 'mobx';

import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';
import { tileNodeSchema, type TileNode } from './tileTree';
import { entityIdSchema, entityTypesSchema, iconSchema } from '#domain/shared/infra/apiSchema/entity';

const tilesSchema = z.record(
  z.string(),
  z.object({
    editors: z.array(
      z.object({
        entityId: entityIdSchema,
        entityType: entityTypesSchema,
        title: z.string(),
        mimeType: z.string().nullable(),
        icon: iconSchema.nullable(),
      }),
    ),
    current: z.string(),
  }),
);

export default class UIState extends KvActiveRecord {
  protected readonly key = 'workbench-ui-state';

  @KvActiveRecord.bidi(tileNodeSchema.optional())
  public accessor root: TileNode | undefined = undefined;

  @KvActiveRecord.bidi(z.string().optional())
  public accessor focusedId: string | undefined = undefined;

  @KvActiveRecord.bidi(tilesSchema.optional())
  public accessor tiles: z.infer<typeof tilesSchema> | undefined = undefined;

  @action
  public update(params: Pick<UIState, 'root' | 'focusedId' | 'tiles'>) {
    Object.assign(this, params);
  }
}
