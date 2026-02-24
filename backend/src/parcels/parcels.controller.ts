import { Controller, Get, Post, Body, Patch, Put, Param, UseGuards, Request } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { MatchingService } from './matching.service';
import { RouteMatchingService } from '../route-planning/route-matching.service';
import { TravelMatchingService } from '../travel-plans/travel-matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';

@ApiTags('parcels')
@ApiBearerAuth()
@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParcelsController {
    constructor(
        private readonly parcelsService: ParcelsService,
        private readonly matchingService: MatchingService,
        private readonly routeMatchingService: RouteMatchingService,
        private readonly travelMatchingService: TravelMatchingService,
        private readonly usersService: UsersService,
    ) { }

    private async getManagerHubId(user: any): Promise<string> {
        let hubId = user.hubId;
        if (!hubId) {
            const userData = await this.usersService.findByEmail(user.email);
            hubId = userData?.hubId;
        }
        if (!hubId) throw new Error('User is not assigned to a hub');
        return hubId;
    }

    @Get('matches-for-me')
    @Roles(Role.TRAVELER)
    @ApiOperation({ summary: 'Get parcels matching traveler route' })
    findMatches(@Request() req) {
        return this.matchingService.findMatchesForTraveler(req.user.userId);
    }

    @Get('route-matches')
    @ApiOperation({ summary: 'Get parcels matching traveler route (location-based)' })
    async findRouteMatches(@Request() req) {
        return this.routeMatchingService.findMatchingParcels(req.user.userId);
    }

    @Post()
    @Roles(Role.CUSTOMER)
    @ApiOperation({ summary: 'Create a new parcel (Customer only)' })
    create(@Body() parcelData: any, @Request() req) {
        return this.parcelsService.create(parcelData, req.user.id || req.user.userId);
    }

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all parcels (Admin only)' })
    findAll() {
        return this.parcelsService.findAll();
    }

    @Get('my-parcels')
    @Roles(Role.CUSTOMER)
    @ApiOperation({ summary: 'Get current customer parcels' })
    findMyParcels(@Request() req) {
        return this.parcelsService.findBySender(req.user.userId);
    }

    @Get('track/:number')
    @ApiOperation({ summary: 'Track a parcel by tracking number' })
    track(@Param('number') number: string) {
        const cleanNumber = number.startsWith('#') ? number.slice(1) : number;
        return this.parcelsService.findOneByTracking(cleanNumber);
    }

    @Put(':id')
    @Roles(Role.ADMIN, Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Update parcel details' })
    update(@Param('id') id: string, @Body() data: any) {
        if (data.status) {
            return this.parcelsService.updateStatus(id, data.status);
        }
        // Handle other updates if needed
        return { success: true };
    }

    @Get('assigned-to-me')
    @Roles(Role.TRAVELER)
    @ApiOperation({ summary: 'Get parcels assigned to current traveler/partner' })
    findAssignedToMe(@Request() req) {
        return this.parcelsService.getByAssignedUser(req.user.userId);
    }

    @Get('hub-history/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get complete history of parcels handled by this hub' })
    getHubHistory(@Param('hubId') hubId: string) {
        return this.parcelsService.getHubHistory(hubId);
    }

    @Post(':id/confirmed-dropoff')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Confirm parcel drop-off at hub' })
    async confirmDropoff(@Param('id') id: string, @Request() req) {
        let hubId = req.user.role === Role.ADMIN ? null : await this.getManagerHubId(req.user);
        return this.parcelsService.confirmHubDropoff(id, hubId || req.user.hubId);
    }

    @Post(':id/confirmed-pickup')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Confirm parcel pickup by traveler' })
    confirmPickup(@Param('id') id: string) {
        return this.parcelsService.confirmHubPickup(id);
    }

    @Get(':id/tracking-logs')
    @ApiOperation({ summary: 'Get tracking logs for a parcel' })
    getTrackingLogs(@Param('id') id: string) {
        return this.parcelsService.getTrackingLogs(id);
    }
    @Post(':id/confirm-match')
    @Roles(Role.CUSTOMER)
    @ApiOperation({ summary: 'Confirm a traveler match (Customer only)' })
    confirmMatch(@Param('id') id: string) {
        return this.travelMatchingService.confirmTraveler(id);
    }

    @Get('hub-inventory/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN, Role.TRAVELER)
    @ApiOperation({ summary: 'Get parcels currently at a specific hub' })
    getHubInventory(@Param('hubId') hubId: string) {
        return this.parcelsService.findByHub(hubId);
    }

    @Post(':id/assign-traveler')
    @Roles(Role.TRAVELER)
    @ApiOperation({ summary: 'Traveler claims a parcel to carry — hub manager must still dispatch' })
    async assignTraveler(@Param('id') id: string, @Request() req) {
        return this.parcelsService.assignTraveler(id, req.user.id || req.user.userId);
    }

    @Get('hub-incoming/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get parcels in transit heading to this hub' })
    getIncomingParcels(@Param('hubId') hubId: string) {
        return this.parcelsService.findIncomingForHub(hubId);
    }

    @Post(':id/dispatch-parcel')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Dispatch a parcel (sets IN_TRANSIT, notifies customer)' })
    dispatchParcel(@Param('id') id: string) {
        return this.parcelsService.dispatchParcel(id);
    }
}
