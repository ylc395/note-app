import { container, singleton } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';
import {
  type ResourceUrl,
  type ResourcesDTO,
  type ResourceUploadResponse,
  isUrls,
  ResourceVO,
} from 'interface/resource';
import type { LintProblem } from 'interface/lint';
import type NoteEditor from 'model/note/Editor';

@singleton()
export default class MarkdownService {
  private readonly remote = container.resolve(remoteToken);

  uploadFiles(files: File[]): Promise<ResourceVO[]>;
  uploadFiles(files: ResourceUrl[]): Promise<ResourceUploadResponse>;
  async uploadFiles(files: File[] | ResourceUrl[]) {
    const _files = isUrls(files)
      ? files
      : await Promise.all(
          files.map(async (file) => {
            return { name: file.name, data: await file.arrayBuffer(), mimeType: file.type };
          }),
        );

    const { body: fileVOs } = await this.remote.post<ResourcesDTO, ResourceUploadResponse>('/resources', {
      files: _files,
    });

    return fileVOs;
  }

  readonly lint = async (editor: NoteEditor) => {
    const { body: problems } = await this.remote.get<void, LintProblem[]>(`/lint/problems/notes/${editor.entityId}`);
    editor.loadLintProblems(problems);
  };
}
