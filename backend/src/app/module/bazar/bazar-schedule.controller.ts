import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { BazarScheduleService } from './bazar-schedule.service';
import {
  AddBazarDateDto,
  AssignBazarSlotDto,
  BazarMonthQueryDto,
  BazarRequestQueryDto,
  ChangeBazarDateStatusDto,
  CreateBazarSwapDto,
  GenerateBazarScheduleDto,
  MoveBazarDutyDto,
  ReleaseBazarSlotDto,
  ReviewBazarRequestDto,
  UpdateBazarDateCapacityDto,
  UpsertBazarScheduleSettingDto,
} from './dto/bazar-schedule.dto';

@ApiTags('Bazar Duty Schedule')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
@Controller('bazar')
export class BazarScheduleController {
  constructor(private readonly scheduleService: BazarScheduleService) {}

  @Put('schedule-settings/:messId')
  @ApiOperation({
    summary: '[MANAGER] Create or update repeating bazar schedule settings',
  })
  async upsertSettings(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Body() dto: UpsertBazarScheduleSettingDto,
  ) {
    const data = await this.scheduleService.upsertSettings(
      messId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return {
      message:
        'Bazar schedule settings saved; active schedules were not changed',
      data,
    };
  }

  @Get('schedule-settings/:messId')
  @ApiOperation({ summary: 'Get repeating bazar schedule settings' })
  async getSettings(@Param('messId') messId: string, @Req() req: Request) {
    const data = await this.scheduleService.getSettings(
      messId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Bazar schedule settings fetched', data };
  }

  @Post('schedules/generate')
  @ApiOperation({
    summary:
      '[MANAGER] Generate the current month schedule from repeating settings',
  })
  async generate(@Req() req: Request, @Body() dto: GenerateBazarScheduleDto) {
    const data = await this.scheduleService.generate(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Monthly bazar schedule generated', data };
  }

  @Get('schedules/mess/:messId')
  @ApiOperation({
    summary: 'Get monthly schedule, slots, overview, and fair distribution',
  })
  async getMonth(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: BazarMonthQueryDto,
  ) {
    const data = await this.scheduleService.getMonth(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return { message: 'Monthly bazar schedule fetched', data };
  }

  @Get('schedules/mess/:messId/history')
  @ApiOperation({ summary: 'Get monthly schedule version history' })
  async getHistory(@Param('messId') messId: string, @Req() req: Request) {
    const data = await this.scheduleService.getHistory(
      messId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Bazar schedule history fetched', data };
  }

  @Post('schedules/:scheduleId/dates')
  @ApiOperation({ summary: '[MANAGER] Add a date to the active schedule' })
  async addDate(
    @Param('scheduleId') scheduleId: string,
    @Req() req: Request,
    @Body() dto: AddBazarDateDto,
  ) {
    const data = await this.scheduleService.addDate(
      scheduleId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar date added', data };
  }

  @Patch('schedule-dates/:dateId/status')
  @ApiOperation({ summary: '[MANAGER] Open or close an unassigned bazar date' })
  async changeDateStatus(
    @Param('dateId') dateId: string,
    @Req() req: Request,
    @Body() dto: ChangeBazarDateStatusDto,
  ) {
    const data = await this.scheduleService.changeDateStatus(
      dateId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: `Bazar date ${dto.status.toLowerCase()}`, data };
  }

  @Patch('schedule-dates/:dateId/capacity')
  @ApiOperation({
    summary: '[MANAGER] Override required member count for one bazar date',
  })
  async updateDateCapacity(
    @Param('dateId') dateId: string,
    @Req() req: Request,
    @Body() dto: UpdateBazarDateCapacityDto,
  ) {
    const data = await this.scheduleService.updateDateCapacity(
      dateId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar date member requirement updated', data };
  }

  @Post('duty-slots/:slotId/claim')
  @ApiOperation({ summary: 'Claim an available bazar duty slot' })
  async claim(@Param('slotId') slotId: string, @Req() req: Request) {
    const data = await this.scheduleService.claimSlot(
      slotId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Bazar duty selected', data };
  }

  @Post('duty-slots/:slotId/assign')
  @ApiOperation({
    summary:
      '[MANAGER] Assign or reassign a duty slot (limit can be bypassed with warning)',
  })
  async assign(
    @Param('slotId') slotId: string,
    @Req() req: Request,
    @Body() dto: AssignBazarSlotDto,
  ) {
    const data = await this.scheduleService.assignSlot(
      slotId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar duty assigned', data };
  }

  @Post('duty-slots/:slotId/unassign')
  @ApiOperation({ summary: '[MANAGER] Immediately unassign a duty slot' })
  async unassign(
    @Param('slotId') slotId: string,
    @Req() req: Request,
    @Body() dto: ReleaseBazarSlotDto,
  ) {
    const data = await this.scheduleService.unassignSlot(
      slotId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar duty unassigned', data };
  }

  @Post('duty-slots/:slotId/release')
  @ApiOperation({
    summary: 'Release own duty before the configured notice deadline',
  })
  async release(
    @Param('slotId') slotId: string,
    @Req() req: Request,
    @Body() dto: ReleaseBazarSlotDto,
  ) {
    const data = await this.scheduleService.requestRelease(
      slotId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return {
      message: data.auto_approved
        ? 'Bazar duty released'
        : 'Bazar duty release request submitted',
      data,
    };
  }

  @Post('duty-slots/:slotId/move')
  @ApiOperation({
    summary: 'Move own bazar duty to an available slot on another date',
  })
  async moveOwnDuty(
    @Param('slotId') slotId: string,
    @Req() req: Request,
    @Body() dto: MoveBazarDutyDto,
  ) {
    const data = await this.scheduleService.moveOwnDuty(
      slotId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar duty moved', data };
  }

  @Get('release-requests/mess/:messId')
  @ApiOperation({ summary: 'List visible bazar release requests' })
  async listReleases(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: BazarRequestQueryDto,
  ) {
    const data = await this.scheduleService.listReleaseRequests(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return { message: 'Bazar release requests fetched', data };
  }

  @Patch('release-requests/:requestId/respond')
  @ApiOperation({
    summary: '[MANAGER] Approve or reject a late release request',
  })
  async reviewRelease(
    @Param('requestId') requestId: string,
    @Req() req: Request,
    @Body() dto: ReviewBazarRequestDto,
  ) {
    const data = await this.scheduleService.reviewRelease(
      requestId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return {
      message: `Bazar release request ${dto.approve ? 'approved' : 'rejected'}`,
      data,
    };
  }

  @Post('swap-requests')
  @ApiOperation({
    summary: 'Request a swap between own duty and another member duty',
  })
  async createSwap(@Req() req: Request, @Body() dto: CreateBazarSwapDto) {
    const data = await this.scheduleService.createSwap(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar swap request submitted', data };
  }

  @Get('swap-requests/mess/:messId')
  @ApiOperation({ summary: 'List visible bazar swap requests' })
  async listSwaps(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: BazarRequestQueryDto,
  ) {
    const data = await this.scheduleService.listSwapRequests(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return { message: 'Bazar swap requests fetched', data };
  }

  @Patch('swap-requests/:requestId/respond')
  @ApiOperation({
    summary: 'Accept or decline a swap addressed to the current member',
  })
  async reviewSwap(
    @Param('requestId') requestId: string,
    @Req() req: Request,
    @Body() dto: ReviewBazarRequestDto,
  ) {
    const data = await this.scheduleService.reviewSwap(
      requestId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return {
      message: `Bazar swap request ${dto.approve ? 'accepted' : 'declined'}`,
      data,
    };
  }

  @Patch('swap-requests/:requestId/cancel')
  @ApiOperation({ summary: 'Cancel own pending swap request' })
  async cancelSwap(@Param('requestId') requestId: string, @Req() req: Request) {
    const data = await this.scheduleService.cancelSwap(
      requestId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Bazar swap request cancelled', data };
  }
}
