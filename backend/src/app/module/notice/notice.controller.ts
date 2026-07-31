import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateNoticeDto, NoticeFilterDto, UpdateNoticeDto } from './dto/notice.dto';
import { NoticeService } from './notice.service';

@ApiTags('Notice Board')
@ApiBearerAuth('access-token')
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Create a notice' })
  async create(@Req() req: Request, @Body() dto: CreateNoticeDto) {
    const data = await this.noticeService.create(req.user!.id, req.user!.role, dto);
    return { message: 'Notice posted successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all notices' })
  async findAll(@Query() query: NoticeFilterDto) {
    const result = await this.noticeService.findAll(query);
    return { message: 'Notices fetched successfully', meta: result.meta, data: result.data };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get notices for a mess' })
  async findByMess(@Param('messId') messId: string, @Req() req: Request, @Query() query: NoticeFilterDto) {
    const result = await this.noticeService.findByMess(messId, req.user!.id, req.user!.role, query);
    return { message: 'Notices fetched successfully', meta: result.meta, data: result.data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Update a notice' })
  async update(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateNoticeDto) {
    const data = await this.noticeService.update(id, req.user!.id, req.user!.role, dto);
    return { message: 'Notice updated successfully', data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Delete a notice' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.noticeService.remove(id, req.user!.id, req.user!.role);
    return data;
  }
}
