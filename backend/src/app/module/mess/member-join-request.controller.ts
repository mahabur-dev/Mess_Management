import {
  Body,
  Controller,
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
import AuthGuard from '../../middlewares/auth.guard';
import { MessService } from './mess.service';
import {
  MemberJoinRequestFilterDto,
  MessFilterDto,
  RequestMemberJoinDto,
  ReviewMemberJoinRequestDto,
} from './dto/mess.dto';

@ApiTags('Member Join Requests')
@ApiBearerAuth('access-token')
@Controller('member-join-requests')
export class MemberJoinRequestController {
  constructor(private readonly messService: MessService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Request to join an active mess as a member' })
  async requestJoin(@Req() req: Request, @Body() dto: RequestMemberJoinDto) {
    const data = await this.messService.requestMemberJoin(req.user!.id, dto);
    return { message: 'Member join request submitted successfully', data };
  }

  @Get('my')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'List my member join requests' })
  async findMine(@Req() req: Request, @Query() query: MessFilterDto) {
    const result = await this.messService.findMyMemberJoinRequests(req.user!.id, query);
    return {
      message: 'Your member join requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('managed')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'List member join requests for messes I manage' })
  async findManaged(@Req() req: Request, @Query() query: MemberJoinRequestFilterDto) {
    const result = await this.messService.findManagedMemberJoinRequests(req.user!.id, query);
    return {
      message: 'Managed member join requests fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Patch(':requestId/review')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Approve or reject a member join request' })
  async review(
    @Param('requestId') requestId: string,
    @Req() req: Request,
    @Body() dto: ReviewMemberJoinRequestDto,
  ) {
    const data = await this.messService.reviewMemberJoinRequest(requestId, req.user!.id, dto);
    return {
      message: `Member join request ${dto.status.toLowerCase()}d successfully`,
      data,
    };
  }
}
