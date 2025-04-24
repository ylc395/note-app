import type { Token } from '#utils/singletonContainer';

export abstract class Runtime {
  public abstract getAppDir(): string;
  public abstract getDeviceName(): string;
  public abstract readonly appName: string;
  public abstract readonly appVersion: string;
  public abstract ready(): Promise<void>;

  static {}
}

export const token: Token<Runtime> = Symbol('runtime');
