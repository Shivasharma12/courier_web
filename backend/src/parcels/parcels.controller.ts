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
    ) { }

    @Get('matches-for-me')
    @Roles(Role.DELIVERY_PARTNER)
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
        return this.parcelsService.create(parcelData, req.user.userId);
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
    @Roles(Role.TRAVELER, Role.DELIVERY_PARTNER)
    @ApiOperation({ summary: 'Get parcels assigned to current traveler/partner' })
    findAssignedToMe(@Request() req) {
        return this.parcelsService.findByAssignedUser(req.user.userId);
    }

    @Post(':id/confirmed-dropoff')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Confirm parcel drop-off at hub' })
    confirmDropoff(@Param('id') id: string, @Request() req) {
        return this.parcelsService.confirmHubDropoff(id, req.user.hubId);
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
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get parcels currently at a specific hub' })
    getHubInventory(@Param('hubId') hubId: string) {
        return this.parcelsService.findByHub(hubId);
    }
}
