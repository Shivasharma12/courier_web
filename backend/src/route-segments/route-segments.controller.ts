import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { RouteSegmentsService } from './route-segments.service';
import { CreateRouteSegmentDto, UpdateRouteSegmentDto } from './dto/route-segment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RouteSegmentStatus } from './entities/route-segment.entity';

@Controller('route-segments')
@UseGuards(JwtAuthGuard)
export class RouteSegmentsController {
    constructor(private readonly routeSegmentsService: RouteSegmentsService) { }

    @Post()
    create(@Body() createDto: CreateRouteSegmentDto) {
        return this.routeSegmentsService.create(createDto);
    }

    @Get('parcel/:parcelId')
    findByParcel(@Param('parcelId') parcelId: string) {
        return this.routeSegmentsService.findByParcel(parcelId);
    }

    @Get('delivery-person/:deliveryPersonId')
    findByDeliveryPerson(
        @Param('deliveryPersonId') deliveryPersonId: string,
        @Query('status') status?: RouteSegmentStatus,
    ) {
        return this.routeSegmentsService.findByDeliveryPerson(deliveryPersonId, status);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.routeSegmentsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateRouteSegmentDto) {
        return this.routeSegmentsService.update(id, updateDto);
    }

    @Post(':id/assign/:deliveryPersonId')
    assignDeliveryPerson(
        @Param('id') id: string,
        @Param('deliveryPersonId') deliveryPersonId: string,
    ) {
        return this.routeSegmentsService.assignDeliveryPerson(id, deliveryPersonId);
    }

    @Post(':id/start')
    startSegment(@Param('id') id: string, @Body('otp') otp: string) {
        return this.routeSegmentsService.startSegment(id, otp);
    }

    @Post(':id/complete')
    completeSegment(@Param('id') id: string, @Body('otp') otp: string) {
        return this.routeSegmentsService.completeSegment(id, otp);
    }
}
