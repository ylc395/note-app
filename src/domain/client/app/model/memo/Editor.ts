import { action, computed, observable } from 'mobx';

export default class Editor {
  constructor(options: {
    initialValue?: string;
    onDestroyed?: () => void;
    onSubmit?: (value: string) => Promise<boolean | void>;
  }) {
    this.options = {
      onDestroyed: options.onDestroyed,
      onSubmit: options.onSubmit,
    };

    this.initialValue = options.initialValue;
    this.update(options.initialValue ?? '');
  }

  public readonly initialValue?: string;

  private readonly options: {
    initialValue?: string;
    onDestroyed?: () => void;
    onSubmit?: (value: string) => Promise<boolean | void>;
  };

  @observable public accessor value = '';

  @action
  public update(value: string) {
    this.value = value;
  }

  @computed
  public get canSubmit() {
    return this.value.length > 0;
  }

  public async submit() {
    let needToDestroy: boolean | void;

    try {
      needToDestroy = await this.options.onSubmit?.(this.value);
    } catch {
      return;
    }

    if (needToDestroy) {
      this.destroy();
    }
  }

  public destroy() {
    this.options.onDestroyed?.();
  }
}
