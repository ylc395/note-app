import { versionDTOSchema } from '@domain/shared/infra/schema/version.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  create: publicProcedure.input(versionDTOSchema).mutation(({ input, ctx: { versionService } }) => {
    return versionService.create(input);
  }),
});
