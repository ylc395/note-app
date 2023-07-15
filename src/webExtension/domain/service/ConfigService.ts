import browser from 'webextension-polyfill';
import { observable, makeObservable, runInAction, action } from 'mobx';
import { CONFIG_KEY, type Config } from 'domain/model/config';
import { EntityTypes } from 'shared/interface/entity';

const defaultConfig: Config = {
  targetEntityType: EntityTypes.Material,
  targetEntityId: {
    [EntityTypes.Material]: null,
    [EntityTypes.Note]: null,
    [EntityTypes.Memo]: null,
  },
};

export default class ConfigService {
  constructor() {
    makeObservable(this);
    this.init();
  }

  @observable config?: Config;

  private async init() {
    const config = await ConfigService.load();
    runInAction(() => (this.config = config));
  }

  static async load() {
    return ((await browser.storage.local.get(CONFIG_KEY))[CONFIG_KEY] as Config | undefined) || defaultConfig;
  }

  @action
  setTargetId(id: string) {
    if (!this.config) {
      throw new Error('no config');
    }

    this.config.targetEntityId[this.config.targetEntityType] = id;
    browser.storage.local.set({ [CONFIG_KEY]: this.config });
  }

  @action
  set<T extends keyof Config>(key: T, value: Config[T]) {
    if (!this.config) {
      throw new Error('no config');
    }

    this.config[key] = value;
    browser.storage.local.set({ [CONFIG_KEY]: this.config });
  }
}
