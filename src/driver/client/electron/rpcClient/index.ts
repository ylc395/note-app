import { createTRPCProxyClient, loggerLink } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';

import type router from './router.js';

export default createTRPCProxyClient<typeof router>({
  links: [loggerLink({ enabled: () => true }), ipcLink()],
});
