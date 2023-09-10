import { infer as Infer, object, string, number } from 'zod';

export const memoQuerySchema = object({ after: string().optional(), limit: number().optional() });

export type ClientMemoQuery = Infer<typeof memoQuerySchema>;
