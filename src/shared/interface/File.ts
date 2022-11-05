import { object, string, boolean, array, type infer as Infer } from 'zod';

export interface FileVO {
  id: number;
  sourceUrl: string;
  mimeType: string;
  deviceName: string;
  isDuplicated?: boolean;
  createdAt?: number;
}

export const FileDTOSchema = object({
  sourceUrl: string().regex(/^file:\/\//),
  mimeType: string().min(1),
  isTemp: boolean().optional(),
});
export const FilesDTOSchema = array(FileDTOSchema);

export type FileDTO = Infer<typeof FileDTOSchema>;

export type FileDataDTO = ArrayBuffer;
