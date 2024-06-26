export type EditableConfig = Partial<{
  unknown: string;
}>;

type UneditableConfig = Partial<{
  'httpServer.enabled': boolean;
}>;

export type Config = EditableConfig & UneditableConfig;

/**
 * @api
 */
export type ConfigDTO = Config;

/**
 * @api
 */
export type ConfigVO = Config;
