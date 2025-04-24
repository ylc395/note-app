import type { inferRouterProxyClient } from '@trpc/client';

import type { Token } from '#utils/singletonContainer';
import type { Routes } from '#api/index';

export type Remote = inferRouterProxyClient<Routes>;

export const token: Token<Remote> = Symbol('rpc');
