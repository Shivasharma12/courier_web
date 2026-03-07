import { Controller, Get, Post, Body, Patch, Put, Param, UseGuards, Request } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
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

    // ─── Customer ─────────────────────────────────────────────────────
    @Post()
    @Roles(Role.CUSTOMER)
    @ApiOperation({ summary: 'Create a new parcel request (Customer only)' })
    create(@Body() parcelData: any, @Request() req) {
        return this.parcelsService.create(parcelData, req.user.id || req.user.userId);
    }

    @Get('my-parcels')
    @Roles(Role.CUSTOMER)
    @ApiOperation({ summary: 'Get all parcels for the current customer' })
    findMyParcels(@Request() req) {
        return this.parcelsService.findBySender(req.user.userId);
    }

    @Post(':id/confirm-match')
    @Roles(Role.CUSTOMER)
    @ApiOperation({ summary: 'Confirm a traveler match (Customer only)' })
    confirmMatch(@Param('id') id: string) {
        return this.travelMatchingService.confirmTraveler(id);
    }

    // ─── Traveler ─────────────────────────────────────────────────────
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

    @Get('assigned-to-me')
    @Roles(Role.TRAVELER)
    @ApiOperation({ summary: 'Get parcels assigned to current traveler' })
    findAssignedToMe(@Request() req) {
        return this.parcelsService.getByAssignedUser(req.user.userId);
    }

    @Post(':id/assign-traveler')
    @Roles(Role.TRAVELER)
    @ApiOperation({ summary: 'Traveler claims a parcel — hub manager must still dispatch' })
    async assignTraveler(@Param('id') id: string, @Request() req) {
        return this.parcelsService.assignTraveler(id, req.user.id || req.user.userId);
    }

    // ─── Hub Manager ──────────────────────────────────────────────────

    /** Parcels waiting for the customer to drop off */
    @Get('hub-pending/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get pending drop-off requests for a hub' })
    getPendingRequests(@Param('hubId') hubId: string) {
        return this.parcelsService.findPendingRequests(hubId);
    }

    /** Parcels physically at hub */
    @Get('hub-inventory/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN, Role.TRAVELER)
    @ApiOperation({ summary: 'Get parcels currently at a specific hub (at_hub status)' })
    getHubInventory(@Param('hubId') hubId: string) {
        return this.parcelsService.findByHub(hubId);
    }

    /** At-hub parcels with a traveler assigned → ready to dispatch */
    @Get('hub-ready/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get parcels at hub with assigned traveler (ready to dispatch)' })
    getReadyForDispatch(@Param('hubId') hubId: string) {
        return this.parcelsService.findReadyForDispatch(hubId);
    }

    /** In-transit parcels heading to this hub */
    @Get('hub-incoming/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get in-transit parcels heading to this hub' })
    getIncomingParcels(@Param('hubId') hubId: string) {
        return this.parcelsService.findIncomingForHub(hubId);
    }

    /** All parcels for this hub (full view) */
    @Get('hub-all/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get all parcels related to this hub' })
    getAllForHub(@Param('hubId') hubId: string) {
        return this.parcelsService.findAllForHub(hubId);
    }

    /** Hub history */
    @Get('hub-history/:hubId')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Get dispatch/delivery history for a hub' })
    getHubHistory(@Param('hubId') hubId: string) {
        return this.parcelsService.getHubHistory(hubId);
    }

    /** Customer physically dropped parcel → hub manager accepts it into inventory */
    @Post(':id/accept-dropoff')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Accept physical customer drop-off (waiting_for_drop → at_hub)' })
    async acceptDropOff(@Param('id') id: string, @Request() req) {
        const hubId = req.user.role === Role.ADMIN ? req.body.hubId : await this.getManagerHubId(req.user);
        return this.parcelsService.acceptDropOff(id, hubId);
    }

    /** Legacy confirmed-dropoff alias */
    @Post(':id/confirmed-dropoff')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Confirm parcel drop-off at hub (legacy alias)' })
    async confirmDropoff(@Param('id') id: string, @Request() req) {
        const hubId = req.user.role === Role.ADMIN ? null : await this.getManagerHubId(req.user);
        return this.parcelsService.acceptDropOff(id, hubId || req.user.hubId);
    }

    /** Receive a parcel arriving from another hub via traveler */
    @Post(':id/receive-incoming')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Receive incoming parcel from traveler (in_transit → at_hub)' })
    async receiveIncoming(@Param('id') id: string, @Request() req) {
        const hubId = await this.getManagerHubId(req.user);
        return this.parcelsService.receiveIncoming(id, hubId);
    }

    /** Dispatch parcel to its assigned traveler */
    @Post(':id/dispatch-parcel')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Dispatch parcel to assigned traveler (at_hub → in_transit)' })
    dispatchParcel(@Param('id') id: string) {
        return this.parcelsService.dispatchParcel(id);
    }

    /** Confirm final delivery at the destination hub */
    @Post(':id/complete-delivery')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Mark parcel as delivered (at_hub → delivered)' })
    completeDelivery(@Param('id') id: string) {
        return this.parcelsService.completeDelivery(id);
    }

    /** Legacy pickup confirmation */
    @Post(':id/confirmed-pickup')
    @Roles(Role.HUB_MANAGER, Role.ADMIN)
    @ApiOperation({ summary: 'Confirm parcel pickup by traveler (legacy)' })
    confirmPickup(@Param('id') id: string) {
        return this.parcelsService.confirmHubPickup(id);
    }

    // ─── Admin ────────────────────────────────────────────────────────
    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all parcels (Admin only)' })
    findAll() {
        return this.parcelsService.findAll();
    }

    @Put(':id')
    @Roles(Role.ADMIN, Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Update parcel details / status' })
    update(@Param('id') id: string, @Body() data: any) {
        if (data.status) return this.parcelsService.updateStatus(id, data.status);
        return { success: true };
    }

    @Get('admin/:id/trace')
    @Roles(Role.ADMIN, Role.HUB_MANAGER)
    @ApiOperation({ summary: 'Full traceability for a parcel (legs + logs)' })
    getAdminTrace(@Param('id') id: string) {
        return this.parcelsService.getAdminTrace(id);
    }

    // ─── Shared ───────────────────────────────────────────────────────
    @Public()
    @Get('track/:number')
    @ApiOperation({ summary: 'Track a parcel by tracking number' })
    track(@Param('number') number: string) {
        const cleanNumber = number.startsWith('#') ? number.slice(1) : number;
        return this.parcelsService.findOneByTracking(cleanNumber);
    }

    @Public()
    @Get(':id/tracking-logs')
    @ApiOperation({ summary: 'Get tracking logs for a parcel' })
    getTrackingLogs(@Param('id') id: string) {
        return this.parcelsService.getTrackingLogs(id);
    }
}
