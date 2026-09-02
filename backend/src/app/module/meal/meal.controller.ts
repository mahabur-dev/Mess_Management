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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import {
  BulkUpdateMealsDto,
  CreateMealDto,
  LockMealDto,
  MealFilterDto,
  SetMealDeadlineDto,
  UpdateMealDto,
  UpdateMealSettingsDto,
} from './dto/meal.dto';
import { MealService } from './meal.service';

@ApiTags('Meal')
@ApiBearerAuth('access-token')
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({
    summary:
      'Upsert own attendance, or another active member attendance when managing the mess',
  })
  async create(@Req() req: Request, @Body() dto: CreateMealDto) {
    const data = await this.mealService.create(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Meal attendance saved successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all meal entries' })
  async findAll(@Query() query: MealFilterDto) {
    const result = await this.mealService.findAll(query);
    return {
      message: 'Meal entries fetched',
      ...result,
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get meal entries for an accessible mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: MealFilterDto,
  ) {
    const result = await this.mealService.findByMess(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return {
      message: 'Meal entries fetched',
      ...result,
    };
  }

  @Get('mess/:messId/summary')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get member meal-cost summary for a mess' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-08-31' })
  async getMealSummary(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.mealService.getMealSummaryByMess(
      messId,
      req.user!.id,
      req.user!.role,
      startDate,
      endDate,
    );
    return { message: 'Meal summary fetched', data };
  }

  @Get('mess/:messId/members')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Get active members available for meal management' })
  async getMealMembers(@Param('messId') messId: string, @Req() req: Request) {
    const data = await this.mealService.getMealMembers(
      messId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Meal members fetched', data };
  }

  @Patch('mess/:messId/attendance/bulk')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({
    summary:
      'Atomically update changed meal-sheet cells for multiple active members',
  })
  async bulkUpdateAttendances(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Body() dto: BulkUpdateMealsDto,
  ) {
    const data = await this.mealService.bulkUpdateAttendances(
      messId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Meal sheet updated successfully', data };
  }

  @Post('mess/:messId/deadline')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({
    summary: 'Set the previous-day decision window for all meal types',
  })
  async setMealDeadline(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Body() dto: SetMealDeadlineDto,
  ) {
    const data = await this.mealService.setMealDeadline(
      messId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Meal decision window updated successfully', data };
  }

  @Get('mess/:messId/deadline')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get the decision window for a target meal date' })
  @ApiQuery({ name: 'date', required: false, example: '2026-08-01' })
  async getMealDeadline(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query('date') date?: string,
  ) {
    const data = await this.mealService.getMealDeadlineInfo(
      messId,
      req.user!.id,
      req.user!.role,
      date,
    );
    return { message: 'Meal decision window fetched', data };
  }

  @Get('mess/:messId/window-status')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Check member edit access for a target meal date' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-01' })
  async getMealWindowStatus(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query('date') date: string,
  ) {
    const data = await this.mealService.getMealDeadlineInfo(
      messId,
      req.user!.id,
      req.user!.role,
      date,
    );
    return {
      message: 'Meal window status fetched',
      data: {
        isWindowOpen: data.isWindowOpen,
        isTargetDateEditable: data.isTargetDateEditable,
      },
    };
  }

  @Get('mess/:messId/settings')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get operational meal settings' })
  async getMealSettings(@Param('messId') messId: string, @Req() req: Request) {
    const data = await this.mealService.getMealSettings(
      messId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Meal settings fetched', data };
  }

  @Patch('mess/:messId/settings')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Update operational meal settings' })
  async updateMealSettings(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Body() dto: UpdateMealSettingsDto,
  ) {
    const data = await this.mealService.updateMealSettings(
      messId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Meal settings updated successfully', data };
  }

  @Patch('mess/:messId/:date/:mealName/lock')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({
    summary: 'Lock or unlock a daily meal, creating the aggregate if necessary',
  })
  async setMealLock(
    @Param('messId') messId: string,
    @Param('date') date: string,
    @Param('mealName') mealName: string,
    @Req() req: Request,
    @Body() dto: LockMealDto,
  ) {
    const data = await this.mealService.setMealLock(
      messId,
      date,
      mealName,
      dto.locked,
      req.user!.id,
      req.user!.role,
    );
    return {
      message: dto.locked
        ? 'Meal locked successfully'
        : 'Meal unlocked successfully',
      data,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get an accessible meal entry by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.mealService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Meal entry fetched', data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Manager update for a meal aggregate' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateMealDto,
  ) {
    const data = await this.mealService.update(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Meal entry updated successfully', data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Manager delete for a meal aggregate' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.mealService.remove(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Meal entry deleted successfully', data };
  }
}
