import { object, type infer as Infer, string } from 'zod';

export const configSchema = object({
  'ui.theme': string(),
}).partial();

type UneditableConfig = Partial<{
  'httpServer.enabled': boolean;
}>;

export type Config = Infer<typeof configSchema> & UneditableConfig;

export type ConfigDTO = Infer<typeof configSchema>;

export type ConfigVO = Config;
