import type { InjectionToken } from 'tsyringe';
import type { ElectronUI } from 'shared/infra/ui';

export interface UI extends ElectronUI {
  feedback: (options: { type: 'success' | 'fail'; content: string; onClick?: () => void }) => Promise<void>;
}

export * from 'shared/infra/ui';

export const token: InjectionToken<UI> = Symbol();
