import { infer as Infer, number, object } from 'zod';

export type PaginationEntity<T> = {
  total: number;
  list: T[];
};

export const paginationQuerySchema = object({
  pageSize: number().min(1).int().optional(),
  page: number().min(1).int().optional(),
});

export type PaginationQuery = Infer<typeof paginationQuerySchema>;
