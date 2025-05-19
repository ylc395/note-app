export function extractDigest(params: {
  lang?: string;
  fullText: string;
  matchIndex: number;
  maxLength: number;
  matchLength: number;
  prefixMaxLength?: number;
}) {
  console.log(params);

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
