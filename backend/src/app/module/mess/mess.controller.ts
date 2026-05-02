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
  AddMemberDto,
  CreateMessDto,
  MessFilterDto,
  UpdateMessDto,
} from './dto/mess.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Messes')
@ApiBearerAuth('access-token')
@Controller('messes')
export class MessController {
  constructor(private readonly messService: MessService) {}

  // Manager creates a mess
  @Post()
  @UseGuards(AuthGuard('MANAGER', 'ADMIN'))
  @ApiOperation({ summary: '[MANAGER] Create a new mess' })
  async create(@Req() req: Request, @Body() dto: CreateMessDto) {
    const data = await this.messService.create(req.user!.id, dto);
    return { message: 'Mess created successfully', data };
  }

  // Admin: get all messes
  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all messes with pagination' })
  async findAll(@Query() query: MessFilterDto) {
    const result = await this.messService.findAll(query);
    return {
      message: 'Messes fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  // Manager: get own mess
  @Get('my-mess')
  @UseGuards(AuthGuard('MANAGER'))
  @ApiOperation({ summary: '[MANAGER] Get own mess details' })
  async findMyMess(@Req() req: Request) {
    const data = await this.messService.findMyMess(req.user!.id);
    return { message: 'Mess fetched successfully', data };
  }

  // Get single mess by ID (Admin or member)
  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get a mess by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.messService.findOne(id);
    return { message: 'Mess fetched successfully', data };
  }

  // Update mess
  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: '[MANAGER/ADMIN] Update mess details' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateMessDto,
  ) {
    const data = await this.messService.update(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Mess updated successfully', data };
  }

  // Admin: delete mess
  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Delete a mess' })
  async remove(@Param('id') id: string) {
    const data = await this.messService.remove(id);
    return { message: 'Mess deleted successfully', data };
  }

  // Manager: add member
  @Post(':id/members')
  @UseGuards(AuthGuard('MANAGER'))
  @ApiOperation({ summary: '[MANAGER] Add a member to the mess' })
  async addMember(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: AddMemberDto,
  ) {
    const data = await this.messService.addMember(id, req.user!.id, dto);
    return { message: 'Member added successfully', data };
  }

  // Manager: remove member
  @Delete(':id/members/:userId')
  @UseGuards(AuthGuard('MANAGER'))
  @ApiOperation({ summary: '[MANAGER] Remove a member from the mess' })
  async removeMember(
    @Param('id') messId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const data = await this.messService.removeMember(
      messId,
      userId,
      req.user!.id,
    );
    return { message: 'Member removed successfully', data };
  }

  // Get members of a mess
  @Get(':id/members')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get members of a mess' })
  async getMembers(@Param('id') id: string, @Query() query: MessFilterDto) {
    const result = await this.messService.getMembers(id, query);
    return {
      message: 'Members fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }
}
