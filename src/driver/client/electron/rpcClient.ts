import { createTRPCProxyClient, loggerLink } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import type { Routes } from '../../server/api/index.js';

export default createTRPCProxyClient<Routes>({
  links: [loggerLink({ enabled: () => true }), ipcLink()],
});
