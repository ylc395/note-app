import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Query } from './decorators';
import {
  memoDTOSchema,
  memoQuerySchema,
  memoPatchDTOSchema,
  type ClientMemoQuery,
  type MemoDTO,
  type MemoPatchDTO,
  type MemoVO,
  type MemoDatesVO,
} from '@domain/model/memo';
import MemoService from '@domain/service/MemoService';

@Controller()
export default class MemosController {
  constructor(private memoService: MemoService) {}

  @Post('/memos')
  async create(@Body(createSchemaPipe(memoDTOSchema)) memoDTO: MemoDTO): Promise<MemoVO> {
    return await this.memoService.create(memoDTO);
  }

  @Get('/memos/tree')
  async query(@Query(createSchemaPipe(memoQuerySchema)) q: ClientMemoQuery): Promise<MemoVO[]> {
    return await this.memoService.getTree(q);
  }

  @Patch('/memos/:id')
  async update(
    @Param('id') id: MemoVO['id'],
    @Body(createSchemaPipe(memoPatchDTOSchema)) patch: MemoPatchDTO,
  ): Promise<MemoVO> {
    return await this.memoService.update(id, patch);
  }

  @Get('/memos/dates')
  async queryDates(): Promise<MemoDatesVO> {
    return await this.memoService.queryDates();
  }
}
