import { KnowledgeTypes } from 'model/content/constants';

export const KNOWLEDGE_TYPES_TEXTS: Readonly<Record<KnowledgeTypes, string>> = {
  [KnowledgeTypes.Materials]: '素材库',
  [KnowledgeTypes.Notes]: '笔记本',
  [KnowledgeTypes.Projects]: '项目',
  [KnowledgeTypes.Memos]: '备忘',
  [KnowledgeTypes.Cards]: '卡片',
};
