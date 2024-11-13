import { Type } from 'di-wise';

export abstract class Runtime {
  public abstract getAppDir(): string;
  public abstract getDeviceName(): string;
  public abstract readonly appName: string;
  public abstract readonly appVersion: string;
  public abstract ready(): Promise<void>;
}

export const token = Type<Runtime>('runtime');
