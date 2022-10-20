export interface FileReader {
  read: (filePath: string) => Promise<{ data: ArrayBuffer; name: string; hash: string }>;
}

export const token = Symbol('fileReader');
