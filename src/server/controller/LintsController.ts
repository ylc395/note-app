import { Controller } from '@nestjs/common';

import type { LintProblem } from 'interface/lint';
import type { NoteVO } from 'interface/note';
import LintService from 'service/LintService';

import { Get, Param } from './decorators';
import { EntityTypes } from 'interface/entity';

@Controller()
export default class LintsController {
  constructor(private readonly lintService: LintService) {}

  @Get('/lint/problems/notes/:id')
  async create(@Param('id') noteId: NoteVO['id']): Promise<LintProblem[]> {
    return await this.lintService.lint({
      type: EntityTypes.Note,
      id: noteId,
    });
  }
}
