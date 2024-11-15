import { Type } from 'di-wise';
import type { inferRouterProxyClient } from '@trpc/client';
import type { Routes } from '#api/index';

export const token = Type<inferRouterProxyClient<Routes>>('rpc');
