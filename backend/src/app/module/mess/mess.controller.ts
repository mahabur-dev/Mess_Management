import {
  Body,
  Controller,
  Delete,
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
import { MessService } from './mess.service';
import {
  AddMemberDto,
  CreateMessDto,
  MessFilterDto,
  UpdateMessDto,
} from './dto/mess.dto';
import AuthGuard from '../../middlewares/auth.guard';
import { MembershipRole } from '@prisma/client';

@ApiTags('Messes')
@ApiBearerAuth('access-token')
@Controller('messes')
export class MessController {
  constructor(private readonly messService: MessService) { }

  // Manager creates a mess
  @Post()
  @UseGuards(AuthGuard('ORGANIZER', 'ADMIN'))
  @ApiOperation({ summary: '[ORGANIZER] Create a new mess' })
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

  // Organizer: get own mess
  @Get('my-mess')
  @UseGuards(AuthGuard('ORGANIZER'))
  @ApiOperation({ summary: '[ORGANIZER] Get own mess details' })
  async findMyMess(@Req() req: Request) {
    const data = await this.messService.findMyMess(req.user!.id);
    return { message: 'Mess fetched successfully', data };
  }

  // Get members of a organizer
  // Get ALL members across all messes owned by the organizer
  @Get('members')
  @UseGuards(AuthGuard('ORGANIZER'))
  @ApiOperation({ summary: 'Get all members from all my messes' })
  async getAllMyMembers(
    @Query() query: MessFilterDto,
    @Req() req: any,           // or use @CurrentUser()
  ) {
    const organizerId = req.user.id;
    const result = await this.messService.getAllMembers(organizerId, query);

    return {
      message: 'All members fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }
  // Get single mess by ID (Admin or member)
  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get a mess by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.messService.findOne(id);
    return { message: 'Mess fetched successfully', data };
  }

  // Update mess
  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: '[ORGANIZER/MANAGER/ADMIN] Update mess details' })
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

  // Delete mess
  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: '[ORGANIZER/MANAGER/ADMIN] Delete a mess' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.messService.remove(id, req.user!.id, req.user!.role);
    return { message: 'Mess deleted successfully', data };
  }

  // Manager: add member
  @Post(':id/members')
  @UseGuards(AuthGuard('ORGANIZER'))
  @ApiOperation({ summary: 'ORGANIZER Add a member to the mess' })
  async addMember(
    // @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: AddMemberDto,
  ) {
    const data = await this.messService.addMember(dto.messId, req.user!.id, dto.email, dto.role);
    return { message: 'Member added successfully', data };
  }

  // Manager: remove member
  @Delete(':id/members/:userId')
  @UseGuards(AuthGuard('ORGANIZER'))
  @ApiOperation({ summary: 'ORGANIZER Remove a member from the mess' })
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

  //assign manager role to a mess
  @Put(':id/members/:userId')
  @UseGuards(AuthGuard('ORGANIZER'))
  @ApiOperation({ summary: 'ORGANIZER Assign manager role to a member' })
  async assignManager(
    @Param('id') messId: string,
    @Param('userId') userId: string,
    @Param('role') role: MembershipRole,
    @Req() req: Request,
  ) {
    const data = await this.messService.assignManager(messId, userId, role, req.user!.id);
    return { message: 'Manager role assigned successfully', data };
  };
}
