import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { TravelPlansService } from './travel-plans.service';
import { TravelMatchingService } from './travel-matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('travel-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TravelPlansController {
    constructor(
        private readonly travelPlansService: TravelPlansService,
        private readonly travelMatchingService: TravelMatchingService
    ) { }

    @Post()
    @Roles(Role.TRAVELER)
    create(@Request() req, @Body() data: any) {
        return this.travelPlansService.create(req.user.id, data);
    }

    @Get()
    findAll() {
        return this.travelPlansService.findAll();
    }

    @Get('mine')
    @Roles(Role.TRAVELER)
    findMine(@Request() req) {
        return this.travelPlansService.findByUser(req.user.id);
    }

    @Get('active')
    findActive() {
        return this.travelPlansService.findActive();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.travelPlansService.findOne(id);
    }

    @Get(':id/matches')
    @Roles(Role.TRAVELER)
    findMatches(@Param('id') id: string) {
        return this.travelMatchingService.findMatchingParcels(id);
    }

    @Post(':id/assign/:parcelId')
    @Roles(Role.TRAVELER)
    assignParcel(@Param('id') id: string, @Param('parcelId') parcelId: string) {
        return this.travelMatchingService.assignParcel(parcelId, id);
    }

    @Put(':id')
    @Roles(Role.TRAVELER, Role.ADMIN)
    update(@Param('id') id: string, @Body() data: any) {
        return this.travelPlansService.update(id, data);
    }

    @Delete(':id')
    @Roles(Role.TRAVELER, Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.travelPlansService.remove(id);
    }
}
