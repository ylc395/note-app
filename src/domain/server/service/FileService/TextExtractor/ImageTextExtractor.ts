import assert from 'node:assert';
import { createScheduler, createWorker, OEM } from 'tesseract.js';
import { cloneDeepWith, difference, mapValues, range } from 'lodash-es';
import path from 'node:path';
import { cpus } from 'node:os';

import { textLocationSchema } from '#domain/shared/infra/apiSchema/file.js';
import { token as runtimeToken } from '#domain/server/infra/runtime.js';
import { token as loggerToken } from '#domain/shared/infra/logger.js';
import container from '#utils/singletonContainer.js';
import type { ExtractResult, TextExtractor } from './extractor.js';
// @see https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016
const SUPPORT_LANGS = {
  afr: 'Afrikaans',
  amh: 'Amharic',
  ara: 'Arabic',
  asm: 'Assamese',
  aze: 'Azerbaijani',
  aze_cyrl: 'Azerbaijani - Cyrillic',
  bel: 'Belarusian',
  ben: 'Bengali',
  bod: 'Tibetan',
  bos: 'Bosnian',
  bul: 'Bulgarian',
  cat: 'Catalan; Valencian',
  ceb: 'Cebuano',
  ces: 'Czech',
  chi_sim: 'Chinese - Simplified',
  chi_tra: 'Chinese - Traditional',
  chr: 'Cherokee',
  cym: 'Welsh',
  dan: 'Danish',
  deu: 'German',
  dzo: 'Dzongkha',
  ell: 'Greek, Modern (1453-)',
  eng: 'English',
  enm: 'English, Middle (1100-1500)',
  epo: 'Esperanto',
  est: 'Estonian',
  eus: 'Basque',
  fas: 'Persian',
  fin: 'Finnish',
  fra: 'French',
  frk: 'German Fraktur',
  frm: 'French, Middle (ca. 1400-1600)',
  gle: 'Irish',
  glg: 'Galician',
  grc: 'Greek, Ancient (-1453)',
  guj: 'Gujarati',
  hat: 'Haitian; Haitian Creole',
  heb: 'Hebrew',
  hin: 'Hindi',
  hrv: 'Croatian',
  hun: 'Hungarian',
  iku: 'Inuktitut',
  ind: 'Indonesian',
  isl: 'Icelandic',
  ita: 'Italian',
  ita_old: 'Italian - Old',
  jav: 'Javanese',
  jpn: 'Japanese',
  kan: 'Kannada',
  kat: 'Georgian',
  kat_old: 'Georgian - Old',
  kaz: 'Kazakh',
  khm: 'Central Khmer',
  kir: 'Kirghiz; Kyrgyz',
  kor: 'Korean',
  kur: 'Kurdish',
  lao: 'Lao',
  lat: 'Latin',
  lav: 'Latvian',
  lit: 'Lithuanian',
  mal: 'Malayalam',
  mar: 'Marathi',
  mkd: 'Macedonian',
  mlt: 'Maltese',
  msa: 'Malay',
  mya: 'Burmese',
  nep: 'Nepali',
  nld: 'Dutch; Flemish',
  nor: 'Norwegian',
  ori: 'Oriya',
  pan: 'Panjabi; Punjabi',
  pol: 'Polish',
  por: 'Portuguese',
  pus: 'Pushto; Pashto',
  ron: 'Romanian; Moldavian; Moldovan',
  rus: 'Russian',
  san: 'Sanskrit',
  sin: 'Sinhala; Sinhalese',
  slk: 'Slovak',
  slv: 'Slovenian',
  spa: 'Spanish; Castilian',
  spa_old: 'Spanish; Castilian - Old',
  sqi: 'Albanian',
  srp: 'Serbian',
  srp_latn: 'Serbian - Latin',
  swa: 'Swahili',
  swe: 'Swedish',
  syr: 'Syriac',
  tam: 'Tamil',
  tel: 'Telugu',
  tgk: 'Tajik',
  tgl: 'Tagalog',
  tha: 'Thai',
  tir: 'Tigrinya',
  tur: 'Turkish',
  uig: 'Uighur; Uyghur',
  ukr: 'Ukrainian',
  urd: 'Urdu',
  uzb: 'Uzbek',
  uzb_cyrl: 'Uzbek - Cyrillic',
  vie: 'Vietnamese',
  yid: 'Yiddish',
};

const SUPPORT_LANG_CODES = Object.keys(SUPPORT_LANGS);
const DEFAULT_LANG_CODES: Array<keyof typeof SUPPORT_LANGS> = ['chi_sim', 'eng'];

export default class ImageTextExtractor implements TextExtractor {
  constructor(private readonly lang: string[], private readonly isMultiple = false) {
    assert(difference(lang, SUPPORT_LANG_CODES).length === 0, 'invalid langs');
  }

  private readonly runtime = container.resolve(runtimeToken);

  private readonly logger = container.resolve(loggerToken);

  public getTextUnitLength() {
    return Promise.resolve(1);
  }

  private scheduler?: Awaited<ReturnType<ImageTextExtractor['createScheduler']>>;

  public async extract({ data, scale }: { data: ArrayBuffer; scale?: number }) {
    // 根据官方文档，job 到了一定数量要销毁 scheduler，重新创建一个
    // https://github.com/naptha/tesseract.js/blob/f9dac0742374940f88100eb47838e902e3b51eb8/docs/workers_vs_schedulers.md#reusing-workers-in-nodejs-server-code
    const JOB_LIMIT = 500;

    if (!this.scheduler || this.scheduler.jobCount > JOB_LIMIT) {
      this.scheduler = await this.createScheduler();
    }

    const scheduler = this.scheduler;
    let result;

    try {
      result = await scheduler.queue.addJob(
        'recognize',
        Buffer.from(data),
        {},
        { text: true, blocks: true, layoutBlocks: true },
      );
    } catch (error) {
      // 常见的异常如读取图片失败
      result = {
        data: { confidence: 0, text: '' },
      };
    }

    const transformedResult: ExtractResult = {
      // 总体置信度不足 60 的，不要入库了
      // 理论上我们应当排除页面各部分中极端低值的干扰。但是总体置信度的算法，在 js 侧不透明，因此我们没法优化总体置信度。故暂时先一刀切
      text: result.data.confidence > 60 ? ImageTextExtractor.postProcessText(result.data.text) : '',
      lang: this.actualLangs,
      location: {
        confidence: result.data.confidence,
        blocks: cloneDeepWith(textLocationSchema.shape.blocks.parse(result.data.blocks || undefined), (value, key) => {
          if ((key === 'bbox' || key === 'baseline') && scale) {
            return mapValues(value, (v) => v / scale);
          }
          if (key === 'text') {
            return ImageTextExtractor.postProcessText(value);
          }
        }),
      },
    };

    if (scheduler.jobCount >= JOB_LIMIT && scheduler.queue.getQueueLen() === 0) {
      scheduler.queue.terminate();
    }

    return transformedResult;
  }

  private get actualLangs() {
    return this.lang.length > 0 ? this.lang : DEFAULT_LANG_CODES;
  }

  public get concurrency() {
    // 最多使用四分之一数量的 CPU
    return this.isMultiple ? Math.max(Math.ceil(cpus().length / 4), 1) : 1;
  }

  private async createScheduler() {
    const langs = this.actualLangs.join('+');
    const scheduler = createScheduler();

    const workers = await Promise.all(
      range(this.concurrency).map(() => {
        return createWorker(langs, OEM.DEFAULT, {
          corePath: path.join(process.cwd(), 'node_modules/tesseract.js-core'),
          cachePath: path.join(this.runtime.getAppDir(), 'ocr_cache'),
          workerBlobURL: false,
          logger: this.logger.debug,
        });
      }),
    );

    for (const worker of workers) {
      scheduler.addWorker(worker);
    }

    return {
      queue: scheduler,
      jobCount: 0,
    };
  }

  public destroy() {
    this.scheduler?.queue.terminate();
  }

  private static postProcessText(text: string) {
    // 这些文字系统不使用空格分割
    const group =
      '[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}\\p{Script=Myanmar}\\p{Punctuation}]';
    const regex = new RegExp(`(?<=(${group}))\\s(?=(${group}))`, 'ug');

    return text.replaceAll(regex, '');
  }

  public static SUPPORT_MIME_TYPES = [
    // 支持 OCR 的图片格式： https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md
    'image/png',
    'image/bmp',
    'image/jpeg',
    'image/portable-bitmap',
    'image/x-portable-bitmap',
    'image/webp',
  ];
}
