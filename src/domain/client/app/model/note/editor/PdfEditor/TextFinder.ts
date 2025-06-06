import { observable } from 'mobx';
import { z } from 'zod';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import type { extractDigest } from '#utils/string';

export type Digest = NonNullable<ReturnType<typeof extractDigest>>;

export interface PageSearchResult {
  page: number;
  digests: Digest[];
}

export default class TextFinder {
  @observable public accessor isEnabled = false;
  @observable public accessor query = '';
  public readonly options = new PersistedMap(
    'pdf-textFinder',
    z.object({
      caseSensitive: z.boolean().optional(),
      entireWord: z.boolean().optional(),
    }),
    {
      caseSensitive: false,
      entireWord: false,
    },
  );

  @observable.ref public accessor searchResult: PageSearchResult[] | undefined;
}
