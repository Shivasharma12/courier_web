import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notifRepo: Repository<Notification>,
    ) { }

    /** Create a persistent in-app notification for a user */
    async create(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string) {
        const notif = this.notifRepo.create({ userId, title, message, type, link });
        await this.notifRepo.save(notif);
        this.logger.log(`[Notification → ${userId}] ${title}: ${message}`);
        return notif;
    }

    /** Get all notifications for a user, newest first */
    async getForUser(userId: string) {
        return this.notifRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    /** Count unread notifications for a user */
    async countUnread(userId: string) {
        return this.notifRepo.count({ where: { userId, isRead: false } });
    }

    /** Mark all notifications as read for a user */
    async markAllRead(userId: string) {
        await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
    }

    /** Mark one notification as read */
    async markRead(id: string, userId: string) {
        await this.notifRepo.update({ id, userId }, { isRead: true });
    }

    // Convenience helpers — called from hub approval/rejection flow
    async notifyHubApproved(managerId: string, hubName: string) {
        return this.create(
            managerId,
            '✅ Hub Approved!',
            `Your hub "${hubName}" has been approved by the administrator and is now active. You can start managing parcels and inventory.`,
            'success',
            '/hub',
        );
    }

    async notifyHubRejected(managerId: string, hubName: string, reason: string) {
        return this.create(
            managerId,
            '❌ Hub Application Rejected',
            `Your hub "${hubName}" was rejected. Reason: ${reason}. Please update your details and re-submit for review.`,
            'error',
            '/hub/profile',
        );
    }

    async notifyAdminsHubUpdated(adminIds: string[], hubName: string, managerName: string) {
        await Promise.all(adminIds.map(adminId =>
            this.create(
                adminId,
                '🔄 Hub Update Needs Review',
                `Hub manager "${managerName}" has updated their hub "${hubName}". Please review the changes in Hub Approvals.`,
                'info',
                '/admin/hubs/approvals',
            )
        ));
    }

    // Legacy-compatible stubs
    notifyCustomer(userId: string, message: string) {
        this.logger.log(`[Notification to Customer ${userId}]: ${message}`);
    }

    notifyTraveler(userId: string, message: string) {
        this.logger.log(`[Notification to Traveler ${userId}]: ${message}`);
    }

    notifyHubManager(userId: string, message: string) {
        this.logger.log(`[Notification to Hub Manager ${userId}]: ${message}`);
    }
}
