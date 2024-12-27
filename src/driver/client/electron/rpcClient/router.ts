import { z } from 'zod';
import type { CreateContextOptions } from 'electron-trpc/main';
import { memoize } from 'lodash-es';
import { t, router } from '#api/trpc.js';
import { routers } from '#api/index.js';

import ElectronUI, { type MenuItem } from '../UI.js';

const createContext = memoize(() => ({
  electronUI: new ElectronUI(),
}));

const publicProcedure = t.procedure.use(({ next, ctx }) => {
  return next({
    ctx: {
      ...createContext(),
      ...(ctx as CreateContextOptions),
    },
  });
});

const menuItemSchema: z.ZodSchema<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    type: z.union([z.literal('normal'), z.literal('separator')]),
    submenu: menuItemSchema.array().optional(),
  }),
);

const electronUIRouter = router({
  openUrl: publicProcedure.input(z.string()).mutation(({ input }) => ElectronUI.openUrl(input)),
  openMenu: publicProcedure
    .input(
      z.object({
        items: menuItemSchema.array(),
        pos: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
    )
    .mutation(({ input, ctx: { electronUI, event } }) => electronUI.openMenu(event.sender, input.items, input.pos)),
  closeMenu: publicProcedure
    .input(z.string())
    .mutation(({ input, ctx: { electronUI } }) => electronUI.closeMenu(input)),
});

export default t.mergeRouters(routers, router({ electronUI: electronUIRouter }));
