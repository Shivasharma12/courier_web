import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HubsService } from './hubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('hubs')
@ApiBearerAuth()
@Controller('hubs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HubsController {
    constructor(private readonly hubsService: HubsService) { }

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
        // We need to fetch the user to get their hubId
        // This assumes req.user.userId is available from JwtAuthGuard
        return this.hubsService.getStats(req.user.hubId);
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
