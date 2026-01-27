import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { DeliveryStatus } from './entities/delivery.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
    constructor(private readonly deliveriesService: DeliveriesService) { }

    @Get('available')
    @Roles(Role.DELIVERY_PARTNER)
    @ApiOperation({ summary: 'Get available delivery tasks' })
    findAvailable() {
        return this.deliveriesService.findAvailable();
    }

    @Patch(':id/status')
    @Roles(Role.DELIVERY_PARTNER)
    @ApiOperation({ summary: 'Update delivery status' })
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: DeliveryStatus,
        @Body('otp') otp?: string
    ) {
        return this.deliveriesService.updateStatus(id, status, otp);
    }

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get all deliveries (Admin only)' })
    findAll() {
        return this.deliveriesService.findAll();
    }

    @Post('accept/:parcelId')
    @Roles(Role.TRAVELER, Role.DELIVERY_PARTNER, Role.ADMIN)
    @ApiOperation({ summary: 'Accept a parcel for delivery' })
    acceptParcel(@Param('parcelId') parcelId: string, @Request() req) {
        return this.deliveriesService.acceptParcel(parcelId, req.user.userId);
    }

    @Get('mine')
    @Roles(Role.DELIVERY_PARTNER, Role.TRAVELER)
    @ApiOperation({ summary: 'Get current user deliveries' })
    findMine(@Request() req) {
        return this.deliveriesService.findMine(req.user.userId);
    }
}
