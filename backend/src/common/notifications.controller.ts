import { Controller, Get, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all notifications for the current user' })
    async getMyNotifications(@Request() req) {
        return this.notificationsService.getForUser(req.user.id);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count for current user' })
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.countUnread(req.user.id);
        return { count };
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllRead(@Request() req) {
        await this.notificationsService.markAllRead(req.user.id);
        return { success: true };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a specific notification as read' })
    async markRead(@Param('id') id: string, @Request() req) {
        await this.notificationsService.markRead(id, req.user.id);
        return { success: true };
    }
}
