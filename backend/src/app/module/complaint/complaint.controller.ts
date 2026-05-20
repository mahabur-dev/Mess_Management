import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { ComplaintFilterDto, CreateComplaintDto, UpdateComplaintStatusDto } from './dto/complaint.dto';
import { ComplaintService } from './complaint.service';

@ApiTags('Complaint / Request')
@ApiBearerAuth('access-token')
@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Submit a complaint or request' })
  async create(@Req() req: Request, @Body() dto: CreateComplaintDto) {
    const data = await this.complaintService.create(req.user!.id, req.user!.role, dto);
    return { message: 'Complaint submitted successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all complaints' })
  async findAll(@Query() query: ComplaintFilterDto) {
    const result = await this.complaintService.findAll(query);
    return { message: 'Complaints fetched successfully', meta: result.meta, data: result.data };
  }

  @Get('my')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get my complaints' })
  async findMyComplaints(@Req() req: Request, @Query() query: ComplaintFilterDto) {
    const result = await this.complaintService.findMyComplaints(req.user!.id, query);
    return { message: 'Your complaints fetched successfully', meta: result.meta, data: result.data };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get complaints for a mess' })
  async findByMess(@Param('messId') messId: string, @Req() req: Request, @Query() query: ComplaintFilterDto) {
    const result = await this.complaintService.findByMess(messId, req.user!.id, req.user!.role, query);
    return { message: 'Complaints fetched successfully', meta: result.meta, data: result.data };
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Update complaint status' })
  async updateStatus(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateComplaintStatusDto) {
    const data = await this.complaintService.updateStatus(id, req.user!.id, req.user!.role, dto);
    return { message: 'Complaint status updated successfully', data };
  }
}
