/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
import createJiti from 'jiti';
import Module from 'node:module';

const jiti = createJiti(__filename);
const originalRequire = Module.prototype.require;

Module.prototype.require = function (this: any, id: string) {
  try {
    return originalRequire.apply(this, arguments as any);
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'ERR_REQUIRE_ESM') {
      return jiti(id);
    }
    throw e;
  }
} as any;
