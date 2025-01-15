import { action, computed, observable } from 'mobx';
import UIState from '../common/UIState';
import { z } from 'zod';

export default class Editor {
  constructor(options: {
    id?: string;
    initialValue?: string;
    onDestroyed?: () => void;
    onSubmit?: (value: string) => Promise<boolean | void>;
  }) {
    if (options.id) {
      this.uiState = new UIState(options.id, z.object({ value: z.string() }));
    }

    this.options = {
      onDestroyed: options.onDestroyed,
      onSubmit: options.onSubmit,
    };

    this.initialValue = options.initialValue;
    this.update(options.initialValue ?? this.uiState?.value?.value ?? '');
  }

  public readonly initialValue?: string;

  private readonly options: {
    initialValue?: string;
    onDestroyed?: () => void;
    onSubmit?: (value: string) => Promise<boolean | void>;
  };

  private readonly uiState;

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

    this.uiState?.clear();

    if (needToDestroy) {
      this.destroy();
    }
  }

  public destroy() {
    this.options.onDestroyed?.();
  }
}
