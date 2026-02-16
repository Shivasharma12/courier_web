import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { HandoversService } from './handovers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HandoverType } from './entities/handover.entity';

@Controller('handovers')
@UseGuards(JwtAuthGuard)
export class HandoversController {
    constructor(private readonly handoversService: HandoversService) { }

    @Post()
    create(@Request() req, @Body() data: { parcelId: string, toUserId: string, type: HandoverType }) {
        return this.handoversService.createHandover(data.parcelId, req.user.id, data.toUserId, data.type);
    }

    @Get(':id/qr')
    getQR(@Param('id') id: string) {
        return this.handoversService.getHandoverQR(id);
    }

    @Post(':id/verify')
    verify(@Param('id') id: string, @Body() data: { code: string }) {
        return this.handoversService.verifyHandover(id, data.code);
    }

    @Get('parcel/:parcelId')
    findByParcel(@Param('parcelId') parcelId: string) {
        return this.handoversService.findByParcel(parcelId);
    }
}
