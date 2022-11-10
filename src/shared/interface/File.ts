import { object, string, boolean, array, type infer as Infer } from 'zod';

export interface FileVO {
  id: number;
  sourceUrl: string;
  mimeType: string;
  size: number;
  deviceName: string;
}

export type CreatedFileVO = {
  id: FileVO['id'];
  isDuplicated: boolean;
  sourceUrl: string;
};

export const FileDTOSchema = object({
  sourceUrl: string().url(),
  mimeType: string().min(1),
  isTemp: boolean().optional(),
});

export const FilesDTOSchema = array(FileDTOSchema);

export type FileDTO = Infer<typeof FileDTOSchema>;
