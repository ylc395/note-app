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
    const needToDestroy = await this.options.onSubmit?.(this.value);

    if (needToDestroy) {
      this.destroy();
    }
  }

  @action
  public reset() {
    this.value = '';
  }

  @action
  public destroy() {
    this.options.onDestroyed?.();
    this.value = '';
  }
}
