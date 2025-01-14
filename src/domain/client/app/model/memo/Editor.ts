import { action, computed, observable } from 'mobx';
import UIState from '../common/UIState';
import { z } from 'zod';

export default class Editor {
  constructor(
    private readonly options: {
      id?: string;
      initialValue?: string;
      onDestroyed?: () => void;
      onSubmit?: (value: string) => void;
    },
  ) {
    if (options.id) {
      this.uiState = new UIState(options.id, z.object({ value: z.string() }));
    }

    this.init();
  }

  private readonly uiState;

  @observable public accessor value = '';

  @action
  public update(value: string) {
    this.value = value;
  }

  private init() {
    const value = this.options.initialValue ?? this.uiState?.value?.value ?? '';
    this.update(value);
  }

  @computed
  public get canSubmit() {
    return this.value.length > 0;
  }

  @action
  public reset() {
    this.value = '';
    this.uiState?.clear();
  }

  public async submit() {
    try {
      await this.options.onSubmit?.(this.value);
    } catch {
      return;
    }

    this.uiState?.clear();
  }

  public destroy(reset?: boolean) {
    if (reset) {
      this.reset();
    }

    this.options.onDestroyed?.();
  }
}
