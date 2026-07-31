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
import { ShoppingService } from './shopping.service';
import {
  CreateShoppingListDto,
  ShoppingFilterDto,
  UpdateShoppingItemDto,
  UpdateShoppingListDto,
} from './dto/shopping.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Shopping')
@ApiBearerAuth('access-token')
@Controller('shopping')
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  @Post('list')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Create a shopping list (Manager/Admin)' })
  async createList(@Req() req: Request, @Body() dto: CreateShoppingListDto) {
    const data = await this.shoppingService.createList(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Shopping list created successfully', data };
  }

  @Get('list')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all shopping lists' })
  async findAll(@Query() query: ShoppingFilterDto) {
    const result = await this.shoppingService.findAll(query);
    return {
      message: 'Shopping lists fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('list/mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get shopping lists for a specific mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: ShoppingFilterDto,
  ) {
    const result = await this.shoppingService.findByMess(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return {
      message: 'Shopping lists fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('list/:id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get a shopping list by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.shoppingService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Shopping list fetched successfully', data };
  }

  @Patch('list/:id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Update a shopping list (Manager/Admin)' })
  async updateList(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateShoppingListDto,
  ) {
    const data = await this.shoppingService.updateList(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Shopping list updated successfully', data };
  }

  @Delete('list/:id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Delete a shopping list (Manager/Admin)' })
  async removeList(@Param('id') id: string, @Req() req: Request) {
    const data = await this.shoppingService.removeList(
      id,
      req.user!.id,
      req.user!.role,
    );
    return data;
  }

  @Patch('item/:itemId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Update a shopping item (mark purchased, update price, etc.)' })
  async updateItem(
    @Param('itemId') itemId: string,
    @Req() req: Request,
    @Body() dto: UpdateShoppingItemDto,
  ) {
    const data = await this.shoppingService.updateItem(
      itemId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Shopping item updated successfully', data };
  }

  @Delete('item/:itemId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Delete a shopping item (Manager/Admin)' })
  async removeItem(@Param('itemId') itemId: string, @Req() req: Request) {
    const data = await this.shoppingService.removeItem(
      itemId,
      req.user!.id,
      req.user!.role,
    );
    return data;
  }
}
