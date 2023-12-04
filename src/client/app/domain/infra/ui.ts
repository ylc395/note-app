import type { InjectionToken } from 'tsyringe';
import type { ElectronUI } from '@shared/domain/infra/ui';

export interface UI extends ElectronUI {
  feedback: (options: { type: 'success' | 'fail'; content: string; onClick?: () => void }) => Promise<void>;
}

export * from '@shared/domain/infra/ui';

export const token: InjectionToken<UI> = Symbol();
