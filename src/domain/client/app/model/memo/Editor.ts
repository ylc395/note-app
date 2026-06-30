import { action, computed, observable } from 'mobx';
import { createMutation } from 'mobx-tanstack-query/preset';

export default class Editor {
  constructor(options: { initialValue?: string; onSubmit: (value: string) => Promise<void> }) {
    this.options = {
      onSubmit: options.onSubmit,
    };

    this.initialValue = options.initialValue;
    this.update(options.initialValue ?? '');
  }

  public readonly initialValue?: string;

  private readonly options: {
    initialValue?: string;
    onSubmit: (value: string) => Promise<void>;
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

  public readonly submit = createMutation(() => this.options.onSubmit(this.value));

  @action
  public reset() {
    this.value = '';
  }
}
