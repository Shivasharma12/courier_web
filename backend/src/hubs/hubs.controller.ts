import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException, NotFoundException, Query, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { HubsService } from './hubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../common/notifications.service';

@ApiTags('hubs')
@ApiBearerAuth()
@Controller('hubs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HubsController {
    constructor(
        private readonly hubsService: HubsService,
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create a new hub (Admin only)' })
    create(@Body() hubData: any) {
        return this.hubsService.create(hubData);
    }

    @Post('my-hub')
    @Roles(Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Create a new hub and assign to current manager' })
    async createMyHub(@Request() req, @Body() hubData: any) {
        const hub = await this.hubsService.createForManager(hubData, req.user.id);

        // Update user's hub assignment in DB
        await this.usersService.updateUser(req.user.id, { hubId: hub.id });

        return hub;
    }

    @Post('my-hub/upload')
    @Roles(Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Upload shop photo and documents for the manager hub' })
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'shopPhoto', maxCount: 1 },
        { name: 'documents', maxCount: 5 },
    ], {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads', 'hubs');
                if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowed = /\.(jpg|jpeg|png|pdf|webp)$/i;
            if (!allowed.test(file.originalname)) {
                return cb(new BadRequestException('Only images (jpg, png, webp) and PDFs are allowed'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }))
    async uploadHubMedia(@Request() req, @UploadedFiles() files: { shopPhoto?: Express.Multer.File[], documents?: Express.Multer.File[] }) {
        const hubId = await this.getManagerHubId(req.user);
        const apiBase = process.env.API_BASE_URL || 'http://localhost:3001/api';

        const shopPhotoUrl = files.shopPhoto?.[0]
            ? `${apiBase}/uploads/hubs/${files.shopPhoto[0].filename}`
            : undefined;
        const documentUrls = files.documents?.map(f => `${apiBase}/uploads/hubs/${f.filename}`) || [];

        // Update media
        const hub = await this.hubsService.updateHubMedia(hubId, shopPhotoUrl, documentUrls.length > 0 ? documentUrls : undefined);

        // Reset to pending for re-approval + notify all admins
        await this.hubsService.setStatusPending(hubId);
        const admins = await this.usersService.findAdmins();
        if (admins.length > 0 && hub) {
            const managerName = req.user.name || req.user.email;
            await this.notificationsService.notifyAdminsHubUpdated(admins.map(a => a.id), hub.name, managerName);
        }

        return hub;
    }

    @Get('pending')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all pending hub approvals (Admin only)' })
    async getPendingHubs() {
        return this.hubsService.findPending();
    }

    @Patch(':id/approve')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Approve a hub (Admin only)' })
    async approveHub(@Param('id') id: string) {
        const hub = await this.hubsService.approveHub(id);
        if (hub) {
            const manager = await this.usersService.findByHubId(hub.id);
            if (manager) {
                await this.notificationsService.notifyHubApproved(manager.id, hub.name);
            }
        }
        return hub;
    }

    @Patch(':id/reject')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Reject a hub (Admin only)' })
    async rejectHub(@Param('id') id: string, @Body('reason') reason: string) {
        if (!reason) throw new BadRequestException('Rejection reason is required');
        const hub = await this.hubsService.rejectHub(id, reason);
        if (hub) {
            const manager = await this.usersService.findByHubId(hub.id);
            if (manager) {
                await this.notificationsService.notifyHubRejected(manager.id, hub.name, reason);
            }
        }
        return hub;
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all hubs' })
    findAll() {
        return this.hubsService.findAll();
    }

    private async getManagerHubId(user: any): Promise<string> {
        let hubId = user.hubId;

        // Fallback: If hubId is missing in token (stale session), fetch it from DB
        if (!hubId) {
            const userData = await this.usersService.findByEmail(user.email);
            hubId = userData?.hubId;
        }

        if (!hubId) {
            throw new BadRequestException('User is not assigned to a hub.');
        }

        return hubId;
    }

    @Get('nearby')
    @ApiOperation({ summary: 'Find nearby hubs by coordinates' })
    async getNearbyHub(@Query('lat') lat: number, @Query('lng') lng: number) {
        return this.hubsService.findNearbyHub(Number(lat), Number(lng));
    }

    @Get('my-hub-stats')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get current hub statistics (or specific hub for Admin)' })
    async getMyHubStats(@Request() req, @Query('hubId') explicitHubId?: string) {
        let hubId = explicitHubId;

        if (!hubId) {
            hubId = await this.getManagerHubId(req.user);
        }

        const stats = await this.hubsService.getStats(hubId);
        if (!stats) throw new NotFoundException('Assigned hub not found.');
        return stats;
    }

    @Patch('my-hub')
    @Roles(Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Submit an update request for manager\'s own hub' })
    async updateMyHub(@Request() req, @Body() data: any) {
        const hubId = await this.getManagerHubId(req.user);

        // Submit request to track changes
        await this.hubsService.submitHubRequest(hubId, req.user.id, {
            name: data.name,
            description: data.description,
            operatingHours: data.operatingHours,
            capacity: data.capacity,
        });

        // Reset hub status to pending — admin must re-approve after any update
        const hub = await this.hubsService.setStatusPending(hubId);

        // Notify all admins
        const admins = await this.usersService.findAdmins();
        if (admins.length > 0 && hub) {
            const managerName = req.user.name || req.user.email;
            await this.notificationsService.notifyAdminsHubUpdated(admins.map(a => a.id), hub.name, managerName);
        }

        return hub;
    }

    @Get('requests/all')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all hub update requests (Admin only)' })
    async getRequests() {
        return this.hubsService.getAllHubRequests();
    }

    @Patch('requests/:id/approve')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Approve a hub update request (Admin only)' })
    async approveRequest(@Param('id') id: string, @Body('comment') comment: string) {
        return this.hubsService.approveHubRequest(id, comment);
    }

    @Patch('requests/:id/reject')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Reject a hub update request (Admin only)' })
    async rejectRequest(@Param('id') id: string, @Body('comment') comment: string) {
        return this.hubsService.rejectHubRequest(id, comment);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific hub' })
    findOne(@Param('id') id: string) {
        return this.hubsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Update a hub (Admin only)' })
    update(@Param('id') id: string, @Body() hubData: any) {
        return this.hubsService.update(id, hubData);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Delete a hub (Admin only)' })
    remove(@Param('id') id: string) {
        return this.hubsService.remove(id);
    }
}
