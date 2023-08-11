import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param } from './decorators';
import {
  memoDTOSchema,
  memoPatchDTOSchema,
  type MemoDTO,
  type ParentMemoVO,
  type MemoPatchDTO,
  type MemoVO,
} from 'model/memo';
import MemoService from 'service/MemoService';

@Controller()
export default class MemosController {
  constructor(private memoService: MemoService) {}

  @Post('/memos')
  async create(@Body(createSchemaPipe(memoDTOSchema)) memoDTO: MemoDTO): Promise<MemoVO> {
    return await this.memoService.create(memoDTO);
  }

  @Patch('/memos/:id')
  async update(
    @Param('id') id: ParentMemoVO['id'],
    @Body(createSchemaPipe(memoPatchDTOSchema)) memoVO: MemoPatchDTO,
  ): Promise<MemoVO> {
    return await this.memoService.update(id, memoVO);
  }

  @Get('/memos')
  async query(): Promise<MemoVO[]> {
    return await this.memoService.query();
  }
}
