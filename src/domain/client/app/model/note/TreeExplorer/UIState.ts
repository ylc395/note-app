import z from 'zod';
import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';

const scrollSchema = z.object({ x: z.number(), y: z.number() }).optional();

export default class UIState extends KvActiveRecord {
  protected override readonly key = 'note-explorer-tree-ui-state';

  @KvActiveRecord.bidi(scrollSchema)
  public accessor scroll: z.infer<typeof scrollSchema>;

  @KvActiveRecord.bidi(z.string().array())
  public accessor expanded: string[] = [];
}
