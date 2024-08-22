import type { InjectionToken } from 'tsyringe';

export const token: InjectionToken<Runtime> = Symbol('runtime');

export abstract class Runtime {
  public abstract getAppDir(): string;
  public abstract getDeviceName(): string;
}
