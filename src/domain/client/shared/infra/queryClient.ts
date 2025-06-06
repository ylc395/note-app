import { queryClient } from 'mobx-tanstack-query/preset';

const defaultOptions = queryClient.getDefaultOptions(); // default options: https://github.com/js2me/mobx-tanstack-query/blob/master/src/preset/configs/default-query-client-config.ts

defaultOptions.queries!.staleTime = 0;
defaultOptions.queries!.refetchOnWindowFocus = true;
defaultOptions.queries!.refetchOnReconnect = true;
defaultOptions.queries!.refetchOnMount = false;
defaultOptions.queries!.networkMode = import.meta.env.VITE_WEB_PLATFORM === 'electron' ? 'always' : 'online';
defaultOptions.queries!.retry = false;
defaultOptions.queries!.enableOnDemand = true;

queryClient.setDefaultOptions(defaultOptions);
