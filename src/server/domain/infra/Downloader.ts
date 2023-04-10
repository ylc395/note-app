export const token = Symbol();

export interface Downloader {
  downloadFile: (url: string) => { name: string; mimeType: string; data: ArrayBuffer } | null;
}
