import { action, computed, observable } from 'mobx';
import { z } from 'zod';
import { compact, debounce, isEqual } from 'lodash-es';

import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { extractDigest } from '#utils/string';
import type PageTextManager from './PageTextManager';

export type Digest = NonNullable<ReturnType<typeof extractDigest>>;

export interface MatchesCount {
  current: number;
  total: number;
}

export interface PageSearchResult {
  page: number;
  digests: Digest[];
}

export default class TextFinder {
  constructor(private readonly textManager: PageTextManager) {
    this.persistedOptions = new PersistedMap(
      `pdf-textFinder-${this.textManager.noteId}`,
      z.object({
        caseSensitive: z.boolean().optional(),
        entireWord: z.boolean().optional(),
        query: z.string().optional(),
      }),
      {},
    );
  }
  @observable public accessor isEnabled = false;
  @observable public accessor result: (MatchesCount & { options: TextFinder['options'] }) | undefined;

  private readonly persistedOptions;

  @computed
  public get options() {
    return this.persistedOptions.toObject();
  }

  @observable.ref public accessor digests: PageSearchResult[] | undefined;

  public readonly setQuery = debounce((value: string) => {
    this.persistedOptions.set('query', value);

    if (!value) {
      this.clearResult();
    }
  }, 500);

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;

    if (!this.isEnabled) {
      this.clearResult();
    }
  }

  public toggleOption(key: 'caseSensitive' | 'entireWord') {
    this.persistedOptions.set(key, this.persistedOptions.get(key));
  }

  @action
  public updateResult({
    pageMatchesLength,
    pageMatches,
    matchesCount,
  }: {
    pageMatches?: number[][];
    pageMatchesLength?: number[][];
    matchesCount: MatchesCount;
  }) {
    const oldOptions = this.result?.options;

    this.result = {
      ...matchesCount,
      options: this.options,
    };

    if (pageMatchesLength && pageMatches && !isEqual(this.options, oldOptions)) {
      this.updateDigests({ pageMatches, pageMatchesLength });
    }
  }

  private readonly updateDigests = debounce(
    action(({ pageMatchesLength, pageMatches }: { pageMatches: number[][]; pageMatchesLength: number[][] }) => {
      const texts = this.textManager.nativeTexts.result.data;

      if (!texts) {
        return;
      }

      this.digests = pageMatches
        .map((matchOffsets: number[], pageIndex) => ({
          page: pageIndex + 1,
          digests: compact(
            matchOffsets.map((offset, index) =>
              extractDigest({
                fullText: texts[pageIndex + 1] || '',
                matchIndex: offset,
                maxLength: 100,
                prefixMaxLength: 30,
                matchLength: pageMatchesLength[pageIndex]![index]!,
              }),
            ),
          ),
        }))
        .filter(({ digests }) => digests.length > 0);
    }),
    500,
  );

  @action
  private clearResult() {
    this.digests = undefined;
    this.result = undefined;
  }

  public destroy() {
    this.updateDigests.cancel();
  }
}
