import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import config from 'src/app/config';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { AiAutomationService } from './ai-automation.service';
import {
  AiCapabilitiesQueryDto,
  ConfirmAiCommandDto,
  CreateTextCommandDto,
  CreateVoiceCommandDto,
} from './dto/ai-command.dto';

@ApiTags('AI Automation')
@ApiBearerAuth('access-token')
@Controller('ai/commands')
@UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
export class AiAutomationController {
  constructor(private readonly service: AiAutomationService) {}

  @Get('capabilities')
  @ApiOperation({ summary: 'Get server-side AI automation capabilities' })
  async capabilities(@Req() req: Request, @Query() query: AiCapabilitiesQueryDto) {
    return {
      message: 'AI capabilities fetched',
      data: await this.service.capabilities(req.user!.id, query.locale),
    };
  }

  @Post('text')
  @ApiOperation({ summary: 'Parse text into an editable, uncommitted command preview' })
  async createText(@Req() req: Request, @Body() dto: CreateTextCommandDto) {
    const data = await this.service.createText(req.user!.id, req.user!.role, dto);
    return { message: 'AI command preview created', data };
  }

  @Post('voice')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { files: 1, fileSize: config.aiAutomation.maxAudioBytes },
    }),
  )
  @ApiOperation({ summary: 'Transcribe voice and create an editable command preview' })
  async createVoice(
    @Req() req: Request,
    @Body() dto: CreateVoiceCommandDto,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    const data = await this.service.createVoice(req.user!.id, req.user!.role, dto, audio);
    return { message: 'Voice command preview created', data };
  }

  @Post(':commandId/confirm')
  @ApiOperation({ summary: 'Atomically confirm an AI command through existing domain services' })
  async confirm(
    @Param('commandId') commandId: string,
    @Req() req: Request,
    @Body() dto: ConfirmAiCommandDto,
  ) {
    const data = await this.service.confirm(commandId, req.user!.id, req.user!.role, dto.payload);
    return { message: 'AI command confirmed', data };
  }

  @Post(':commandId/cancel')
  @ApiOperation({ summary: 'Cancel an uncommitted AI command' })
  async cancel(@Param('commandId') commandId: string, @Req() req: Request) {
    const data = await this.service.cancel(commandId, req.user!.id);
    return { message: 'AI command cancelled', data };
  }
}
