import { object, string, type infer as Infer, enum as zodEnum } from 'zod';

export interface TopicVO {
  id: number;
  name: string;
  parentId?: TopicVO['id'];
}

export const TopicQuerySchema = object({
  keyword: string(),
});

export type TopicQuery = Infer<typeof TopicQuerySchema>;
