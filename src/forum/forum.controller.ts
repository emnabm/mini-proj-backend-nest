import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ForumService } from './forum.service';

@ApiTags('forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('threads')
  @ApiOperation({ summary: 'Liste des threads du forum' })
  getThreads() {
    return this.forumService.getThreads();
  }

  @Post('threads')
  @ApiOperation({ summary: 'Créer un thread' })
  createThread(@Request() req, @Body() dto: { title: string }) {
    return this.forumService.createThread(dto.title, req.user.id);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Détails d un thread' })
  getThread(@Param('id') id: string) {
    return this.forumService.getThreadById(id);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Messages d un thread' })
  getMessages(@Param('id') id: string) {
    return this.forumService.getMessages(id);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message (avec @mentions)' })
  sendMessage(
    @Request() req,
    @Param('id') threadId: string,
    @Body()
    dto: {
      content: string;
      attachmentUrl?: string;
      replyToId?: string;
    },
  ) {
    return this.forumService.sendMessage(
      threadId,
      req.user.id,
      dto.content,
      dto.attachmentUrl,
      dto.replyToId,
    );
  }

  @Get('search/users')
  @ApiOperation({ summary: 'Recherche username pour autocomplétion @mentions' })
  searchUsers(@Query('q') q: string) {
    // Utilisé par le frontend pour l'autocomplétion lors de la frappe @
    return []; // Déléguer à UsersController /users/search
  }
}
