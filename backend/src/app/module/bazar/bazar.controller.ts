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
import { BazarService } from './bazar.service';
import {
  BazarFilterDto,
  CreateBazarDto,
  UpdateBazarDto,
} from './dto/bazar.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Bazar')
@ApiBearerAuth('access-token')
@Controller('bazar')
export class BazarController {
  constructor(private readonly bazarService: BazarService) {}

  // Create bazar entry
  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Create a bazar entry (all roles)' })
  async create(@Req() req: Request, @Body() dto: CreateBazarDto) {
    const data = await this.bazarService.create(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar entry created successfully', data };
  }

  // Admin: get all bazars
  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all bazar entries with filters' })
  async findAll(@Query() query: BazarFilterDto) {
    const result = await this.bazarService.findAll(query);
    return {
      message: 'Bazar entries fetched',
      meta: result.meta,
      data: result.data,
    };
  }

  // Get bazars by mess ID
  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get bazar entries for a specific mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: BazarFilterDto,
  ) {
    const result = await this.bazarService.findByMess(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return {
      message: 'Bazar entries fetched',
      meta: result.meta,
      data: result.data,
    };
  }

  // Get single bazar entry
  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get a bazar entry by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.bazarService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Bazar entry fetched', data };
  }

  // Update bazar entry
  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Update a bazar entry' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateBazarDto,
  ) {
    const data = await this.bazarService.update(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bazar entry updated successfully', data };
  }

  // Delete bazar entry
  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Delete a bazar entry' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.bazarService.remove(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Bazar entry deleted successfully', data };
  }
}
