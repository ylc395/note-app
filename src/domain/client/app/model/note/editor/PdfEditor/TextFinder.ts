import { action, observable } from 'mobx';
import { z } from 'zod';
import { compact, debounce, isEqual } from 'lodash-es';

import type PageTextManager from './PageTextManager';
import assert from 'assert';

export interface Digest {
  text: string;
  hasLeading: boolean;
  hasTrailing: boolean;
  matchIndex: number;
  matchLength: number;
}

export interface MatchesCount {
  current: number;
  total: number;
}

export const optionsSchema = z
  .object({
    caseSensitive: z.boolean().catch(false),
    entireWord: z.boolean().catch(false),
    query: z.string().catch(''),
  })
  .optional();

export default class TextFinder {
  constructor(private readonly textManager: PageTextManager) {}

  @observable public accessor isEnabled = false;

  @observable public accessor result: (MatchesCount & { options: TextFinder['options'] }) | undefined;

  @observable.ref public accessor digests: Array<{ page: number; digests: Digest[] }> | undefined;

  @observable public accessor options: z.infer<typeof optionsSchema>;

  @action
  public initOptions(v: TextFinder['options']) {
    this.options = v;
  }

  public readonly setQuery = debounce(
    action((value: string) => {
      assert(this.options);
      this.options.query = value;

      if (!value) {
        this.clearResult();
      }
    }),
    500,
  );

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;

    if (!this.isEnabled) {
      this.clearResult();
    }
  }

  @action
  public toggleOption(key: 'caseSensitive' | 'entireWord') {
    assert(this.options);
    this.options[key] = !this.options[key];
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
              TextFinder.extractDigest({
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

  private static extractDigest(params: {
    lang?: string;
    fullText: string;
    matchIndex: number;
    maxLength: number;
    matchLength: number;
    prefixMaxLength?: number;
  }) {
    // 第一个参数（locale）似乎不影响 Intl.Segmenter 分词的正确性
    // 没有明确的结论，初步的讨论见 https://stackoverflow.com/questions/75747868/how-exactly-locale-param-affects-the-result-of-intl-segmenter-execution-in-jav
    // AI 认为这是因为各个 JS 引擎的内部有类似智能识别语言种类的优化
    const segmenter = new Intl.Segmenter(params.lang, { granularity: 'word' });
    const digest = {
      text: '',
      hasLeading: false,
      hasTrailing: false,
      matchIndex: -1,
      matchLength: params.matchLength,
    };
    const prefixMaxLength = params.prefixMaxLength ?? Math.floor(params.maxLength / 2);

    let i = 0;
    let isFirstSegmentInDigest = true;

    for (const segment of segmenter.segment(params.fullText)) {
      if (segment.index <= params.matchIndex && segment.index + segment.segment.length > params.matchIndex) {
        digest.matchIndex = digest.text.length + (params.matchIndex - segment.index);
      }

      if (digest.text.length + segment.segment.length > params.maxLength) {
        digest.hasTrailing = true;
        break;
      }

      if (params.matchIndex - segment.index <= prefixMaxLength) {
        if (digest.text || segment.isWordLike) {
          digest.text += segment.segment;
        }

        if (i > 0 && isFirstSegmentInDigest) {
          digest.hasLeading = true;
        }

        isFirstSegmentInDigest = false;
      }

      i++;
    }

    if (digest.text) {
      return digest;
    }

    return undefined;
  }
}
