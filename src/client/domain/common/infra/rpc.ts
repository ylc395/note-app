import { InjectionToken } from 'tsyringe';
import type { inferRouterProxyClient } from '@trpc/client';
import type { Routes } from '@server/controller';

export const token: InjectionToken<inferRouterProxyClient<Routes>> = Symbol('rpc');
