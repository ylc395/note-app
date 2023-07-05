import '../../src/server/driver/enableEsm';
import { Test } from '@nestjs/testing';

import BasicModule from '../../dist/electron/server/driver/localHttpServer/module';

export const mochaHooks = async () => {
  const module = await Test.createTestingModule({
    imports: [BasicModule],
  }).compile();

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeAll: function (this: any) {
      this.nestModule = module;
    },
  };
};
