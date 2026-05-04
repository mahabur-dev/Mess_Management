import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserService } from './user.service';
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UserFilterDto,
} from './dto/user.dto';
import AuthGuard from '../../middlewares/auth.guard';
import { uploadConfig } from 'src/app/helpers/fileUploder';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin: get all users
  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all users with pagination & filters' })
  async findAll(@Query() query: UserFilterDto) {
    const result = await this.userService.findAll(query);
    return {
      message: 'Users fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  // Get own profile (any authenticated user)
  @Get('profile')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get own profile' })
  async getProfile(@Req() req: Request) {
    const data = await this.userService.findOne(req.user!.id);
    return { message: 'Profile fetched successfully', data };
  }

  // Admin: get single user by ID
  @Get(':id')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get a user by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.userService.findOne(id);
    return { message: 'User fetched successfully', data };
  }

  // Update own profile (with optional image)
  @Patch('profile')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Update own profile (with optional profile image)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage', uploadConfig))
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data = await this.userService.updateProfile(req.user!.id, dto, file);
    return { message: 'Profile updated successfully', data };
  }

  // Admin: update user active status
  @Patch(':id/status')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Activate or deactivate a user' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const data = await this.userService.updateStatus(id, dto);
    return { message: 'User status updated', data };
  }

  // Admin: delete user
  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Delete a user permanently' })
  async remove(@Param('id') id: string) {
    const data = await this.userService.remove(id);
    return { message: 'User deleted successfully', data };
  }
}
