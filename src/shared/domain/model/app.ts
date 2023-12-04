import { boolean, object, infer as Infer } from 'zod';

export interface AppServerStatus {
  port: number;
}

export const appServerDTOSchema = object({
  isOnline: boolean(),
});

export type AppServerDTO = Infer<typeof appServerDTOSchema>;
