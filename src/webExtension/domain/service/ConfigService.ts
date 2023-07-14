import browser from 'webextension-polyfill';
import { observable, makeObservable, runInAction, action } from 'mobx';
import { CONFIG_KEY, type Config } from 'domain/model/config';
import { EntityTypes } from 'shared/interface/entity';

const defaultConfig: Config = {
  targetEntityType: EntityTypes.Material,
  targetEntityId: null,
};

export default class ConfigService {
  constructor() {
    makeObservable(this);
    this.init();
  }

  @observable config: Config = defaultConfig;

  private async init() {
    const config = await ConfigService.load();

    if (config) {
      runInAction(() => (this.config = config));
    }
  }

  static async load() {
    return (await browser.storage.local.get(CONFIG_KEY))[CONFIG_KEY] as Config | undefined;
  }

  @action
  set<T extends keyof Config>(key: T, value: Config[T]) {
    this.config[key] = value;

    if (key === 'targetEntityType') {
      this.config.targetEntityId = null;
    }

    browser.storage.local.set({ [CONFIG_KEY]: this.config });
  }
}
