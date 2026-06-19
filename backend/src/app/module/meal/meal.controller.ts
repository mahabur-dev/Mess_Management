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
import { MealService } from './meal.service';
import {
  SetMealDeadlineDto,
  CreateMealDto,
  MealFilterDto,
  UpdateMealDto,
} from './dto/meal.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Meal')
@ApiBearerAuth('access-token')
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Add a meal entry (all roles)' })
  async create(@Req() req: Request, @Body() dto: CreateMealDto) {
    const data = await this.mealService.create(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Meal entry added successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all meal entries' })
  async findAll(@Query() query: MealFilterDto) {
    const result = await this.mealService.findAll(query);
    return {
      message: 'Meal entries fetched',
      meta: result.meta,
      data: result.data,
      totalMealCount: result.totalMealCount,
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get meal entries for a specific mess' })
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
      meta: result.meta,
      data: result.data,
      totalMealCount: result.totalMealCount,
    };
  }

  @Get('mess/:messId/summary')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({
    summary:
      'Get meal cost summary for a mess (meal rate, each member cost & balance)',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-04-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-04-30' })
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

  /**
   * Set the meal deadline window for a mess.
   * This replaces the old "close meal time" functionality.
   * The deadline is a time window (e.g. 22:00 -> 11:00) during which
   * members can add/update meals. After the window closes, only managers can modify.
   */
  @Post('mess/:messId/deadline')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Set meal deadline window (start & end time)' })
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
    return data;
  }

  /**
   * Get the current meal deadline info for a mess.
   */
  @Get('mess/:messId/deadline')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get meal deadline info for a mess' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-15' })
  async getMealDeadline(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query('date') date?: string,
  ) {
    const data = await this.mealService.getMealDeadlineInfo(messId, date);
    return { message: 'Meal deadline info fetched', data };
  }

  /**
   * Check if meal window is open for a specific date.
   */
  @Get('mess/:messId/window-status')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Check if meal window is open for a date' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-15' })
  async getMealWindowStatus(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query('date') date?: string,
  ) {
    const isOpen = await this.mealService.isMealWindowOpen(
      messId,
      date ?? new Date().toISOString().slice(0, 10),
    );
    return { message: 'Meal window status fetched', data: { isWindowOpen: isOpen } };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get a meal entry by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.mealService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Meal entry fetched', data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Update a meal entry' })
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
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Delete a meal entry' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.mealService.remove(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Meal entry deleted successfully', data };
  }
}