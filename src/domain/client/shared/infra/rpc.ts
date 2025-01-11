import { Type } from 'di-wise';
import type { inferRouterProxyClient } from '@trpc/client';
import type { Routes } from '#api/index';

export type Remote = inferRouterProxyClient<Routes>;

export const token = Type<Remote>('rpc');
