import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateMealPatternDto, UpdateMealPatternDto } from './dto/meal-pattern.dto';
import { MealPatternService } from './meal-pattern.service';
import { MealPatternStatus } from '@prisma/client';

@ApiTags('Meal Patterns')
@ApiBearerAuth('access-token')
@Controller('meal-patterns')
@UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
export class MealPatternController {
  constructor(private readonly service: MealPatternService) {}
  @Post() @ApiOperation({ summary: 'Create a structured daily or weekly meal pattern' })
  create(@Req() req: Request, @Body() dto: CreateMealPatternDto) { return this.service.create(req.user!.id, req.user!.role, dto).then((data) => ({ message: 'Meal pattern created successfully', data })); }
  @Get() @ApiOperation({ summary: 'List accessible meal-pattern versions' })
  list(@Req() req: Request, @Query('membershipId') membershipId?: string) { return this.service.findMine(req.user!.id, req.user!.role, membershipId).then((data) => ({ message: 'Meal patterns fetched', data })); }
  @Get('mess/:messId') @ApiOperation({ summary: 'List all active-member meal-pattern versions for one mess' })
  listByMess(@Req() req: Request, @Param('messId') messId: string) { return this.service.findByMess(req.user!.id, req.user!.role, messId).then((data) => ({ message: 'Meal patterns fetched', data })); }
  @Get(':id') get(@Req() req: Request, @Param('id') id: string) { return this.service.findOne(id, req.user!.id, req.user!.role).then((data) => ({ message: 'Meal pattern fetched', data })); }
  @Patch(':id') update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateMealPatternDto) { return this.service.update(id, req.user!.id, req.user!.role, dto).then((data) => ({ message: 'Meal pattern version created', data })); }
  @Post(':id/pause') pause(@Req() req: Request, @Param('id') id: string) { return this.status(req, id, MealPatternStatus.PAUSED); }
  @Post(':id/resume') resume(@Req() req: Request, @Param('id') id: string) { return this.status(req, id, MealPatternStatus.ACTIVE); }
  @Post(':id/cancel') cancel(@Req() req: Request, @Param('id') id: string) { return this.status(req, id, MealPatternStatus.CANCELLED); }
  private status(req: Request, id: string, status: MealPatternStatus) { return this.service.changeStatus(id, req.user!.id, req.user!.role, status).then((data) => ({ message: `Meal pattern ${status.toLowerCase()} successfully`, data })); }
}
