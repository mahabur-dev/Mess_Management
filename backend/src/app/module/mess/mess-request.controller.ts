import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MessService } from './mess.service';
import {
  MessFilterDto,
  RequestMessRegistrationDto,
  ReviewMessRequestDto,
} from './dto/mess.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Mess — Registration Requests')
@ApiBearerAuth('access-token')
@Controller('mess-requests')
export class MessRequestController {
  constructor(private readonly messService: MessService) {}

  // ─── Submit a new registration request ───────────────────────────────────────
  @Post()
  @UseGuards(AuthGuard('MEMBER'))
  @ApiOperation({ summary: '[MEMBER] Submit a mess registration request' })
  async requestRegistration(
    @Req() req: Request,
    @Body() dto: RequestMessRegistrationDto,
  ) {
    const data = await this.messService.requestRegistration(req.user!.id, dto);
    return { message: 'Mess registration request submitted successfully', data };
  }

  // ─── Admin: list all requests ─────────────────────────────────────────────────
  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] List all mess registration requests' })
  async findAll(@Query() query: MessFilterDto) {
    const result = await this.messService.findRequests(query);
    return {
      message: 'Mess registration requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  // ─── Member: list own requests ────────────────────────────────────────────────
  @Get('my')
  @UseGuards(AuthGuard('MEMBER'))
  @ApiOperation({ summary: '[MEMBER] List my own mess registration requests' })
  async findMine(@Req() req: Request, @Query() query: MessFilterDto) {
    const result = await this.messService.findMyRequests(req.user!.id, query);
    return {
      message: 'Your mess registration requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  // ─── Admin: approve or reject a request ──────────────────────────────────────
  @Patch(':requestId/review')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Approve or reject a mess registration request' })
  async review(
    @Param('requestId') requestId: string,
    @Req() req: Request,
    @Body() dto: ReviewMessRequestDto,
  ) {
    const data = await this.messService.reviewRequest(requestId, req.user!.id, dto);
    return {
      message: `Mess registration request ${dto.status.toLowerCase()}d successfully`,
      data,
    };
  }

  // ─── Admin: delete a request ─────────────────────────────────────────────────
  @Delete(':requestId')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Delete a mess registration request' })
  async delete(@Param('requestId') requestId: string) {
    const data = await this.messService.deleteRequest(requestId);
    return { message: 'Mess registration request deleted successfully', data };
  }
}
