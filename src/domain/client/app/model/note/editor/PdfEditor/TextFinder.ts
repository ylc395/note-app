import { action, observable } from 'mobx';
import { z } from 'zod';
import { compact, debounce } from 'lodash-es';

import type PageTextManager from './PageTextManager';

export interface Digest {
  text: string;
  hasLeading: boolean;
  hasTrailing: boolean;
  matchIndex: number;
  matchLength: number;
}

interface SearchResult {
  pageMatches?: number[][];
  pageMatchesLength?: number[][];
  current: number;
  total: number;
}

/*
 * 记录用户的搜索条件，并保存搜索结果（含摘要）
 * 其中，搜索结果由外部提供。该类本身没有搜索能力，只负责从 pageTextManager 中，根据搜索结果的位置信息等提取摘要
 */
export default class TextFinder {
  constructor(private readonly textManager: PageTextManager) {}

  @observable public accessor isEnabled = false;

  @observable public accessor result: SearchResult | undefined;

  @observable.ref public accessor digests: Array<{ page: number; digests: Digest[] }> | undefined;

  @observable public accessor options: z.infer<typeof TextFinder.schema> = {};

  @action
  public init(v?: TextFinder['options']) {
    if (v) {
      this.options = v;
    }
  }

  public readonly setKeyword = debounce(
    action((value: string) => {
      if (value === this.options.query) {
        return;
      }

      this.clearResult();
      this.options.query = value;
    }),
    500,
  );

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;
    this.clearResult();
  }

  @action
  public toggleOption(key: 'caseSensitive' | 'entireWord') {
    this.clearResult();
    this.options[key] = !this.options[key];
  }

  @action
  public updateResult(result: SearchResult) {
    this.result = result;

    if (result.pageMatchesLength && result.pageMatches) {
      this.updateDigests({
        pageMatches: result.pageMatches,
        pageMatchesLength: result.pageMatchesLength,
      });
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
  public clearResult() {
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

  public static readonly schema = z.object({
    caseSensitive: z.boolean().optional().catch(undefined),
    entireWord: z.boolean().optional().catch(undefined),
    query: z.string().optional().catch(undefined),
  });
}
