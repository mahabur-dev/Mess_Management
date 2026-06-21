import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { ContactRequestFilterDto, CreateContactRequestDto, ReviewContactRequestDto } from './dto/contact-request.dto';
import { ContactRequestService } from './contact-request.service';

@ApiTags('Contact Requests')
@Controller('contact-requests')
export class ContactRequestController {
  constructor(private readonly contactRequestService: ContactRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Public: submit a contact or subscription request' })
  async create(@Body() dto: CreateContactRequestDto) {
    const data = await this.contactRequestService.create(dto);
    return { message: 'Contact request submitted successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] List all contact requests' })
  async findAll(@Query() query: ContactRequestFilterDto) {
    const result = await this.contactRequestService.findAll(query);
    return {
      message: 'Contact requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Review a contact request' })
  async review(@Param('id') id: string, @Req() req: Request, @Body() dto: ReviewContactRequestDto) {
    const data = await this.contactRequestService.review(id, req.user!.id, dto);
    return { message: 'Contact request updated successfully', data };
  }
}
