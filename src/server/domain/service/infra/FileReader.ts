export interface FileReader {
  read: (filePath: string) => Promise<{ data: ArrayBuffer; name: string }>;
}

export const token = Symbol('fileReader');
