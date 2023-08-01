import browser from 'webextension-polyfill';
import { observable, makeObservable, runInAction, action, computed } from 'mobx';

import { CONFIG_KEY, type Config } from 'model/config';
import { EntityTypes } from 'interface/entity';
import type MainApp from 'infra/MainApp';
import type NoteTree from 'model/NoteTree';

const defaultConfig: Config = {
  targetEntityType: EntityTypes.Material,
  targetEntityId: {
    [EntityTypes.Material]: null,
    [EntityTypes.Note]: null,
    [EntityTypes.Memo]: null,
  },
};

export default class ConfigService {
  constructor(private readonly mainApp: MainApp) {
    makeObservable(this);
    this.init();
  }

  @observable.ref targetTree?: NoteTree;
  @observable private config?: Config;

  @computed
  get target() {
    const targetType = this.get('targetEntityType');
    const targetId = targetType && this.get('targetEntityId')?.[targetType];

    if (!targetId || !this.targetTree) {
      return '';
    }

    const ancestors = this.targetTree.getAncestors(targetId);
    const node = this.targetTree.getNode(targetId);

    return {
      title: node.title,
      path: [...ancestors, node].map(({ title }) => title).join(' / '),
    };
  }

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

    this.set('targetEntityId', {
      ...this.config.targetEntityId,
      [this.config.targetEntityType]: id,
    });
  }

  @action
  set<T extends keyof Config>(key: T, value: Config[T]) {
    if (!this.config) {
      throw new Error('no config');
    }

    this.config[key] = value;
    browser.storage.local.set({ [CONFIG_KEY]: this.config });
  }

  get<T extends keyof Config>(key: T): Config[T] | undefined {
    return this.config?.[key];
  }

  readonly updateTargetTree = async () => {
    const targetType = this.get('targetEntityType');
    const targetId = targetType && this.get('targetEntityId')?.[targetType];

    if (!targetType) {
      return;
    }

    this.targetTree?.destroy();
    runInAction(() => (this.targetTree = undefined));
    const tree = await this.mainApp.getTree(targetType, targetId);

    if (this.targetTree) {
      return;
    }

    tree.on('nodeSelected', ({ id }) => {
      this.setTargetId(id);
    });

    tree.on('nodeExpanded', async ({ id }) => {
      const children = await this.mainApp.getChildren(targetType, id);
      tree.updateTree(children);
    });

    runInAction(() => (this.targetTree = tree));
  };
}
