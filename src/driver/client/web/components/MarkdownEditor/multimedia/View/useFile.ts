import { QueryClient, useQuery } from '@tanstack/solid-query';
import container from '#utils/singletonContainer';
import { token } from '#domain/client/shared/infra/rpc';
import type { Accessor } from 'solid-js';
import type { FileVO } from '#domain/shared/model/file';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      networkMode: 'always',
    },
  },
});

export default function useFile(fileId: Accessor<FileVO['id'] | undefined>) {
  const remote = container.resolve(token);

  return useQuery(
    () => ({
      queryFn: ({ queryKey: [_, { id }], signal }) => remote.file.queryOneById.query(id, { signal }),
      enabled: Boolean(fileId()),
      queryKey: ['files', { id: fileId()! }] as const,
    }),
    () => queryClient,
  );
}
