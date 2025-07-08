import assert from 'node:assert';
import { createScheduler, createWorker, OEM, type Scheduler } from 'tesseract.js';
import { cloneDeepWith, mapValues, memoize, range, xor } from 'lodash-es';
import path from 'node:path';

import { textLocationSchema } from '#domain/shared/infra/apiSchema/file.js';
import { token as runtimeToken } from '#domain/server/infra/runtime.js';
import { token as loggerToken } from '#domain/shared/infra/logger.js';
import container from '#utils/singletonContainer.js';
import type { Job } from './job.js';

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

export default class ImageTextExtractor {
  constructor() {
    this.createScheduler.cache = new Map();
  }
  private readonly runtime = container.resolve(runtimeToken);
  private readonly logger = container.resolve(loggerToken);
  private scheduler?: {
    lang: Job['lang'];
    queue: Scheduler;
    totalJobCount: number;
    activeJobCount: number;
  };

  public async extract({ data, lang, scale }: { data: ArrayBuffer; lang: Job['lang']; scale: number }) {
    assert(ImageTextExtractor.isValidLangs(lang));

    // scheduler 里的所有 worker 参数必须相同
    if (this.scheduler && xor(lang, this.scheduler.lang).length > 0) {
      assert(this.scheduler.activeJobCount === 0 && this.scheduler.queue.getQueueLen() === 0, 'queue is not empty');
      await this.scheduler.queue.terminate();
      this.scheduler = undefined;
    }

    if (!this.scheduler) {
      this.scheduler = await this.createScheduler(lang);
    }

    this.scheduler.totalJobCount += 1;
    // 根据官方文档，job 到了一定数量要销毁 scheduler，重新创建一个
    // https://github.com/naptha/tesseract.js/blob/f9dac0742374940f88100eb47838e902e3b51eb8/docs/workers_vs_schedulers.md#reusing-workers-in-nodejs-server-code
    const shouldDestroy = this.scheduler.totalJobCount === 500;
    const { scheduler } = this;

    if (shouldDestroy) {
      this.scheduler = undefined;
    }

    scheduler.activeJobCount += 1;
    const result = await scheduler.queue.addJob(
      'recognize',
      Buffer.from(data),
      {},
      { text: true, blocks: true, layoutBlocks: true },
    );
    scheduler.activeJobCount -= 1;

    if (shouldDestroy) {
      scheduler.queue.terminate();
    }

    return {
      text: result.data.text,
      location: {
        confidence: result.data.confidence,
        blocks: cloneDeepWith(textLocationSchema.shape.blocks.parse(result.data.blocks || undefined), (value, key) => {
          if (key === 'bbox' || key === 'baseline') {
            return mapValues(value, (v) => v / scale);
          }
        }),
      },
    };
  }

  private readonly createScheduler = memoize(
    (lang: Job['lang']) => {
      assert((this.createScheduler.cache as Map<string, unknown>).size === 0, 'can not create');

      const scheduler = createScheduler();
      const result = Promise.all(
        range(2).map(() => {
          return createWorker(lang.join('+'), OEM.DEFAULT, {
            corePath: path.join(process.cwd(), 'node_modules/tesseract.js-core'),
            cachePath: path.join(this.runtime.getAppDir(), 'ocr_cache'),
            workerBlobURL: false,
            logger: this.logger.debug,
          });
        }),
      ).then((workers) => {
        for (const worker of workers) {
          scheduler.addWorker(worker);
        }

        return {
          lang,
          queue: scheduler,
          totalJobCount: 0,
          activeJobCount: 0,
        };
      });

      result.finally(() => {
        this.createScheduler.cache.clear?.();
      });

      return result;
    },
    (lang) => lang.join('+'),
  );

  public static isValidLangs(langs: string[]) {
    return langs.length > 0 && langs.every((lang) => SUPPORT_LANG_CODES.includes(lang));
  }
}
