import { container } from 'tsyringe';

import VersionService from '@domain/service/VersionService.js';
import { versionDTOSchema } from '@shared/domain/model/version.js';
import { publicProcedure, router } from './trpc.js';

const versionProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { versionService: container.resolve(VersionService) } });
});

export default router({
  create: versionProcedure.input(versionDTOSchema).mutation(({ input, ctx: { versionService } }) => {
    return versionService.create(input);
  }),
});
