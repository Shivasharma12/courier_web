import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

@ApiTags('hubs')
@ApiBearerAuth()
@Controller('hubs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HubsController {
    constructor(
        private readonly hubsService: HubsService,
        private readonly usersService: UsersService,
    ) { }

    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create a new hub (Admin only)' })
    create(@Body() hubData: any) {
        return this.hubsService.create(hubData);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all hubs' })
    findAll() {
        return this.hubsService.findAll();
    }

    @Get('my-hub-stats')
    @Roles(Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Get current hub statistics' })
    async getMyHubStats(@Request() req) {
        return this.hubsService.getStats(req.user.hubId);
    }

    @Patch('my-hub')
    @Roles(Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Update manager\'s own hub details' })
    async updateMyHub(@Request() req, @Body() data: any) {
        let hubId = req.user.hubId;

        // Fallback: If hubId is missing in token (stale session), fetch it from DB
        if (!hubId) {
            const user = await this.usersService.findByEmail(req.user.email);
            hubId = user?.hubId;
        }

        if (!hubId) throw new BadRequestException('User is not assigned to a hub. Please log out and back in.');

        const currentHub = await this.hubsService.findOne(hubId);
        if (!currentHub) throw new NotFoundException('Hub not found');

        // Allow updating name and location components only if they were previously missing
        const updates: any = {
            capacity: data.capacity,
            operatingHours: data.operatingHours,
            description: data.description,
        };

        if (!currentHub.name) updates.name = data.name;
        if (!currentHub.address) updates.address = data.address;
        if (!currentHub.lat || currentHub.lat === 0) updates.lat = data.lat;
        if (!currentHub.lng || currentHub.lng === 0) updates.lng = data.lng;

        return this.hubsService.update(hubId, updates);
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
