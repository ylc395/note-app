import { createTRPCProxyClient, loggerLink } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import type { Routes } from '@server/controller';

export default createTRPCProxyClient<Routes>({
  links: [loggerLink({ enabled: () => true }), ipcLink()],
});
