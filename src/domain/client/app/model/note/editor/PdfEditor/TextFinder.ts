import { action, computed, observable } from 'mobx';
import { z } from 'zod';
import { compact, debounce, isEqual } from 'lodash-es';

import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { extractDigest } from '#utils/string';
import type PdfEditor from './index';

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
  constructor(private readonly editor: PdfEditor) {}
  @observable public accessor isEnabled = false;
  @observable public accessor query = '';
  @observable public accessor result: (MatchesCount & { options: TextFinder['options'] }) | undefined;

  private readonly persistedOptions = new PersistedMap(
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

  @computed
  public get options() {
    return {
      ...this.persistedOptions.toObject(),
      query: this.query,
    } as const;
  }

  @observable.ref public accessor digests: PageSearchResult[] | undefined;

  public readonly setQuery = debounce(
    action((value: string) => {
      this.query = value;
    }),
    500,
  );

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;
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
    if (!this.options.query) {
      this.clearResult();
      return;
    }

    const isSearchAgain =
      this.result && isEqual(this.options, this.result.options) && this.result.total > matchesCount.total;

    if (isSearchAgain) {
      return;
    }

    this.result = {
      ...matchesCount,
      options: this.options,
    };

    if (pageMatchesLength && pageMatches) {
      this.updateDigests({ pageMatches, pageMatchesLength });
    }
  }

  private readonly updateDigests = debounce(
    action(({ pageMatchesLength, pageMatches }: { pageMatches: number[][]; pageMatchesLength: number[][] }) => {
      const texts = this.editor.texts;

      if (!texts || isEqual(this.options, this.result?.options)) {
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
